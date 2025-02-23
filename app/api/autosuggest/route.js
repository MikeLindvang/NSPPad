import { getServerSession } from 'next-auth';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';
import { OpenAI } from 'openai';
import dbConnect from '@/lib/dbConnect';
import Project from '@/models/Project';
import AuthorStyle from '@/models/AuthorStyle';
import BookStyle from '@/models/BookStyle';

export async function POST(req) {
  try {
    console.log('✅ Received AutoSuggest Request');

    // 🔹 Authenticate User
    const session = await getServerSession(authOptions);
    if (!session) {
      console.log('❌ Unauthorized Access');
      return new Response(JSON.stringify({ error: 'Unauthorized' }), {
        status: 401,
      });
    }

    // 🔹 Extract Input Data
    const { text, projectId } = await req.json();
    console.log('🔍 AutoSuggest Input:', { text, projectId });

    if (!text || text.length < 5) {
      return new Response(JSON.stringify({ error: 'Invalid input data' }), {
        status: 400,
      });
    }

    // 🔹 Connect to Database
    await dbConnect();

    // 🔹 Fetch Project Context (Book Style & Author Style)
    let bookTone = 'balanced';
    let writingStyle = 'engaging and natural';
    let descriptionLevel = 'moderate';

    if (projectId) {
      const project = await Project.findOne({
        _id: projectId,
        userId: session.user.id,
      })
        .populate('bookStyleId')
        .populate('authorStyleId');

      if (project) {
        bookTone = project.bookStyleId?.tone || bookTone;
        writingStyle = project.authorStyleId?.style || writingStyle;
        descriptionLevel =
          project.bookStyleId?.descriptionLevel >= 7
            ? 'highly detailed'
            : project.bookStyleId?.descriptionLevel <= 3
            ? 'minimalist'
            : 'moderate';
      }
    }

    // 🔹 Define Style Rules in a Concise Manner
    const styleRules = `
      The book's tone is **${bookTone}**, meaning the suggestion should match its emotional depth and pacing.
      The writing style follows **${writingStyle}**, so maintain a natural flow that fits the author's approach.
      The description level is **${descriptionLevel}**, so ensure sensory details align with this style.
      Avoid forced poetic phrasing or overly dramatic wording unless it naturally fits the context.
    `;

    // 🔹 Define AI Prompt
    const prompt = `
      The user is writing a story and paused after the following text:
      "${text}"
      Based on the following style constraints:
      ${styleRules}
      Suggest a **natural continuation** that seamlessly fits the writing style.
      Return **only one** short phrase as a suggestion.
    `;

    // 🔹 Call OpenAI
    const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
    const aiResponse = await openai.chat.completions.create({
      model: 'gpt-4o-mini',
      messages: [{ role: 'system', content: prompt }],
      max_tokens: 15,
    });

    console.log('✅ OpenAI AutoSuggest Response Received');

    const suggestion = aiResponse.choices[0]?.message?.content.trim() || '';

    console.log('🎁 AutoSuggest Suggestion:', suggestion);

    return new Response(JSON.stringify({ suggestion }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (error) {
    console.error('❌ Error in AutoSuggest Route:', error);
    return new Response(JSON.stringify({ error: 'Internal Server Error' }), {
      status: 500,
    });
  }
}
