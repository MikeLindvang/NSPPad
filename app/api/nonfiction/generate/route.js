import { getServerSession } from 'next-auth';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';
import dbConnect from '@/lib/dbConnect';
import Project from '@/models/Project';
import { OpenAI } from 'openai';

const openai = new OpenAI();

export async function POST(req) {
  try {
    console.log('🧠 Nonfiction Generate Route Hit');

    // Authenticate User
    const session = await getServerSession(authOptions);
    if (!session) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), {
        status: 401,
      });
    }

    // Parse Request Body
    const { projectId, documentId } = await req.json();
    if (!projectId || !documentId) {
      return new Response(
        JSON.stringify({ error: 'Missing projectId or documentId' }),
        { status: 400 }
      );
    }

    await dbConnect();

    // Load the project
    const project = await Project.findOne({
      _id: projectId,
      userId: session.user.id,
    });

    if (!project) {
      return new Response(JSON.stringify({ error: 'Project not found' }), {
        status: 404,
      });
    }

    const doc = project.documents.id(documentId);
    if (!doc) {
      return new Response(JSON.stringify({ error: 'Document not found' }), {
        status: 404,
      });
    }

    const topic = project.metadata?.outline?.topic || '';
    const prompt = buildNonfictionPrompt(doc.title, doc.outlineNotes, topic);

    const aiResponse = await openai.chat.completions.create({
      model: 'gpt-4o',
      messages: [
        { role: 'system', content: prompt },
        { role: 'user', content: `Write the chapter titled "${doc.title}".` },
      ],
      max_tokens: 3000, // ✅ Allows ~2000 words
      temperature: 0.6,
    });

    const suggestion = aiResponse.choices[0]?.message?.content.trim() || '';

    return new Response(JSON.stringify({ suggestion }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (error) {
    console.error('❌ Error generating nonfiction content:', error);
    return new Response(JSON.stringify({ error: 'Internal Server Error' }), {
      status: 500,
    });
  }
}

function buildNonfictionPrompt(title, notes, topic) {
  return `
You are an expert nonfiction writing assistant.

Your task is to write a full chapter titled: "${title}".
${
  notes
    ? `Use the outline notes below to guide the structure, content, and tone:\n\n"${notes}"`
    : `There are no notes for this chapter. Use the book topic "${
        topic || 'general nonfiction'
      }" and the section title to make your best guess.`
}

Instructions:
- Output must be valid semantic HTML.
- Do not use markdown.
- Use <h2>, <h3>, <p>, <ul>, <li>, etc. to format the content.
- Write in a helpful, engaging tone with clear structure.
- Avoid overly verbose intros or summaries. Get to the point quickly.
- Use subheadings to break up the text if appropriate.
- You may write up to 2000 words if needed.

Respond ONLY with the HTML content. Do not include explanations, formatting tips, or metadata.
`.trim();
}
