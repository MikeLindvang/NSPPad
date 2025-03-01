import { getServerSession } from 'next-auth';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';
import { OpenAI } from 'openai';
import dbConnect from '@/lib/dbConnect';
import Project from '@/models/Project';

export async function POST(req) {
  try {
    console.log('✅ Received EnhanceText Request');

    // 🔹 Authenticate User
    const session = await getServerSession(authOptions);
    if (!session) {
      console.log('❌ Unauthorized Access');
      return new Response(JSON.stringify({ error: 'Unauthorized' }), {
        status: 401,
      });
    }

    // 🔹 Extract Input Data
    const { text, projectId, options } = await req.json();
    console.log('🔍 EnhanceText Input:', { text, projectId, options });

    if (!text || text.length < 5) {
      return new Response(JSON.stringify({ error: 'Invalid input data' }), {
        status: 400,
      });
    }

    // 🔹 Connect to Database
    await dbConnect();

    // 🔹 Fetch Project Context (if available)
    let project = null;
    if (projectId) {
      project = await Project.findOne({
        _id: projectId,
        userId: session.user.id,
      });
    }

    // 🔹 Generate Style Rules Based on Selected Options
    const depthSettings = [];
    if (options?.sensoryDetails) {
      depthSettings.push(
        'Enhance sensory details: focus on sight, sound, smell, touch, and taste.'
      );
    }
    if (options?.emotionalResonance) {
      depthSettings.push(
        'Amplify emotional depth: Show feelings subtly through body language and internal reactions.'
      );
    }
    if (options?.deepPOV) {
      depthSettings.push(
        'Maintain deep POV: Avoid filtering words like "he saw" or "she felt."'
      );
    }
    if (options?.conflict) {
      depthSettings.push(
        'Increase conflict: Subtly raise stakes or tension in the scene.'
      );
    }

    // 🔹 Construct AI Prompt
    const prompt = `
      The user has selected the following sentence for enhancement:
"${text}"

Enhance the sentence while strictly **matching the existing word choice and vocabulary**. 
Maintain the original style, ensuring that the enhanced versions feel **natural and seamless**.
**SELF-CHECK**
 - Are you matching word choice and vocabulary? (YES/NO)
 - Are you maintaining the original style? (YES/NO)
 IF THE ANSWER TO ANY OF THE ABOVE QUESTIONS ARE NO, REWRITE UNTIL BOTH ANSWERS ARE YES.

Apply the following enhancement rules:
${
  depthSettings.length > 0
    ? depthSettings.join('\n')
    : 'Enhance depth while maintaining the original style.'
}

- You **MAY** expand the sentence slightly **only if** it naturally enhances depth, but avoid unnecessary embellishment.
- Do **NOT** introduce new concepts or shift the meaning of the sentence.
- Ensure that the refined versions fit seamlessly into the surrounding text.

Return **three different enhanced versions** of this sentence.
Separate each variation with "###".

    `;

    // 🔹 Call OpenAI API
    const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
    const aiResponse = await openai.chat.completions.create({
      model: 'gpt-4o-mini',
      messages: [{ role: 'system', content: prompt }],
      max_tokens: 200,
    });

    console.log('✅ OpenAI Response Received');

    // 🔹 Extract AI Suggestions
    const rawSuggestions = aiResponse.choices[0]?.message?.content || '';
    let suggestions = rawSuggestions
      .split('###')
      .map((s) => s.trim())
      .filter(Boolean);

    // Ensure we return at least one suggestion
    if (suggestions.length === 0) {
      suggestions = [text]; // Fallback: return original text
    }

    console.log('🎁 Enhanced Suggestions:', suggestions);

    return new Response(JSON.stringify({ suggestions }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (error) {
    console.error('❌ Error in EnhanceText Route:', error);
    return new Response(JSON.stringify({ error: 'Internal Server Error' }), {
      status: 500,
    });
  }
}
