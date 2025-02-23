import { getServerSession } from 'next-auth';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';
import { OpenAI } from 'openai';
import dbConnect from '@/lib/dbConnect';
import Project from '@/models/Project';

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

    if (projectId) {
      const project = await Project.findOne({
        _id: projectId,
        userId: session.user.id,
      });
    }

    // 🔹 Define AI Prompt
    const prompt = `
      The user is writing a story and paused after the following text:
      "${text}"
      Focus on adding depth to the story by suggestions focused on sensory details, emotions, or character development.
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
