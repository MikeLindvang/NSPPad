import { getServerSession } from 'next-auth';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';
import NonfictionTemplates from '@/lib/NonfictionTemplates';
import OpenAI from 'openai';

const openai = new OpenAI();

export async function POST(req) {
  const session = await getServerSession(authOptions);
  if (!session) {
    return new Response(JSON.stringify({ error: 'Unauthorized' }), {
      status: 401,
    });
  }

  try {
    const { topic, bookSetup } = await req.json();

    if (!topic || !bookSetup?.template || !bookSetup.length) {
      return new Response(
        JSON.stringify({ error: 'Missing topic, template, or length' }),
        { status: 400 }
      );
    }

    const template = NonfictionTemplates[bookSetup.template];
    if (!template || typeof template.generateOutlinePrompt !== 'function') {
      return new Response(
        JSON.stringify({ error: 'Invalid or incomplete template' }),
        { status: 400 }
      );
    }

    const prompt = template.generateOutlinePrompt(topic);

    const aiResponse = await openai.chat.completions.create({
      model: 'gpt-4o-mini',
      messages: [
        {
          role: 'system',
          content:
            'You are a nonfiction book coach helping authors create clear, structured outlines.',
        },
        {
          role: 'user',
          content: `I'm writing a ${bookSetup.length}-length nonfiction book on "${topic}". ${prompt}

Return the structured outline as XML using this format for each section:

<section>
  <title>Section Title</title>
  <notes>1–2 sentence summary of the section</notes>
</section>

Return ONLY the XML. No explanations, no intros, just XML.`,
        },
      ],
      temperature: 0.7,
    });

    const aiText = aiResponse.choices[0].message.content;
    console.log('🧠 Raw AI Output:\n', aiText);

    const sections = parseXmlSections(aiText);

    return new Response(
      JSON.stringify({
        topic,
        sections,
      }),
      {
        status: 200,
        headers: { 'Content-Type': 'application/json' },
      }
    );
  } catch (error) {
    console.error('❌ Error in outline generation:', error);
    return new Response(JSON.stringify({ error: 'Internal Server Error' }), {
      status: 500,
    });
  }
}

// 🔧 Helper to extract <section><title>...</title><notes>...</notes></section>
function parseXmlSections(xml) {
  const sectionRegex =
    /<section>\s*<title>(.*?)<\/title>\s*<notes>(.*?)<\/notes>\s*<\/section>/gs;
  const sections = [];
  let match;

  while ((match = sectionRegex.exec(xml)) !== null) {
    sections.push({
      title: match[1].trim(),
      notes: match[2].trim(),
    });
  }

  return sections;
}
