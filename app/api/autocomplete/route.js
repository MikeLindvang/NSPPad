import { getServerSession } from 'next-auth';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';
import { OpenAI } from 'openai';
import dbConnect from '@/lib/dbConnect';
import Project from '@/models/Project';
import AuthorStyle from '@/models/AuthorStyle';
import BookStyle from '@/models/BookStyle';

export async function POST(req) {
  try {
    console.log('✅ Received Autocomplete Request');

    // 🔹 Authenticate User
    const session = await getServerSession(authOptions);
    if (!session) {
      console.log('❌ Unauthorized Access');
      return new Response(JSON.stringify({ error: 'Unauthorized' }), {
        status: 401,
      });
    }

    // 🔹 Extract Input Data
    const { text, mode, modifier = null, projectId } = await req.json(); // ✅ Ensure modifier & projectId are defined
    console.log('🔍 Autocomplete Input:', { text, mode, modifier, projectId });

    if (!text || text.length < 10 || !mode) {
      console.log('❌ Invalid Input Data');
      return new Response(JSON.stringify({ error: 'Invalid input data' }), {
        status: 400,
      });
    }

    // 🔹 Connect to Database
    await dbConnect();

    // 🔹 Fetch Project Details (if projectId is provided)
    let projectStyles = { bookStyle: null, authorStyle: null };

    if (projectId) {
      console.log('🔍 Fetching project styles...');
      const project = await Project.findOne({
        _id: projectId,
        userId: session.user.id,
      })
        .populate('bookStyleId')
        .populate('authorStyleId');

      if (project) {
        projectStyles.bookStyle = project.bookStyleId;
        projectStyles.authorStyle = project.authorStyleId;
      }
    }

    // 🔹 If no project-specific styles, use default styles
    if (!projectStyles.bookStyle) {
      projectStyles.bookStyle = await BookStyle.findOne({
        userId: session.user.id,
        defaultStyle: true,
      });
    }

    if (!projectStyles.authorStyle) {
      projectStyles.authorStyle = await AuthorStyle.findOne({
        userId: session.user.id,
        defaultStyle: true,
      });
    }

    console.log(
      '🎭 Using Book Style:',
      projectStyles.bookStyle?.name || 'Default'
    );
    console.log(
      '✍ Using Author Style:',
      projectStyles.authorStyle?.name || 'Default'
    );

    // 🔹 Construct Prompt Based on Styles
    let styleInstructions = '';

    if (projectStyles.authorStyle) {
      styleInstructions += `
      ✍ **Author Style Preferences**
      - Narrative Voice: ${projectStyles.authorStyle.narrativeVoice}
      - Sentence Structure: ${projectStyles.authorStyle.sentenceStructure}
      - Formality: ${projectStyles.authorStyle.formality}
      - Use of Metaphors: ${projectStyles.authorStyle.useOfMetaphors}
      - Pacing: ${projectStyles.authorStyle.pacingPreference}
      - Dialogue Style: ${projectStyles.authorStyle.dialogueStyle}
      - Descriptive Level: ${projectStyles.authorStyle.descriptiveLevel}/10
      `;
    }

    if (projectStyles.bookStyle) {
      styleInstructions += `
      📖 **Book Style Preferences**
      - Genre: ${projectStyles.bookStyle.genre}
      - Themes: ${projectStyles.bookStyle.themes.join(', ')}
      - Tone: ${projectStyles.bookStyle.tone}
      - Pacing: ${projectStyles.bookStyle.pacing}
      - World-Building Depth: ${projectStyles.bookStyle.worldBuildingDepth}
      - Character Focus: ${projectStyles.bookStyle.characterFocus}
      - Plot Complexity: ${projectStyles.bookStyle.plotComplexity}
      `;
    }

    // 🔹 Base Instructions for Enhancement or Continuation
    let modeInstructions =
      mode === 'enhance'
        ? `You are an expert writing coach improving storytelling depth. Enhance the following text while maintaining the specified style preferences.

        You will ensure the text is enriched with sensory details, deep POV, emotional resonance, and engaging conflict.
      
      ${styleInstructions}

      Return three variations, separated by "###". The variations should be aware of the context but FOCUS on enhancing the PROVIDED FOCUS text. Avoid providing more than 3 sentences for each variation.`
        : `You are an expert storytelling AI. Generate three distinct ways to **continue** this text while ensuring a smooth flow and adhering to the specified style preferences.

        You will ensure the text is enriched with sensory details, deep POV, emotional resonance, and engaging conflict.
      
      ${styleInstructions}

      Return three variations, separated by "###". Avoid providing more than 3 sentences for each variation.`;

    // 🔹 Inject Action/Dialogue if requested
    if (modifier === 'action') {
      modeInstructions += `
      
      🔥 **Action Injection:**
      - Continue the text by introducing **dynamic action**.
      - Use **fast-paced, impactful descriptions**.
      - Show, don’t tell—let movement drive the scene.
      `;
    } else if (modifier === 'dialogue') {
      modeInstructions += `
      
      🗨 **Dialogue Injection:**
      - Continue the passage with **engaging dialogue**.
      - Keep character voices **distinct** and natural.
      - Balance dialogue with action and internal thoughts.
      `;
    }

    console.log('🔍 Final Prompt:', modeInstructions);

    // 🔹 Call OpenAI (GPT-4o-mini for balance between cost & quality)
    const openai = new OpenAI({
      apiKey: process.env.OPENAI_API_KEY,
    });

    const aiResponse = await openai.chat.completions.create({
      model: 'gpt-3.5-turbo',
      messages: [
        { role: 'system', content: modeInstructions },
        { role: 'user', content: text },
      ],
      max_tokens: 500,
    });

    console.log('✅ OpenAI Response Received');

    // 🔹 Ensure response is properly formatted
    const rawSuggestions = aiResponse.choices[0]?.message?.content || '';
    const suggestions = rawSuggestions
      .split('###')
      .map((s) => s.trim())
      .filter(Boolean);

    return new Response(JSON.stringify({ suggestions }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (error) {
    console.error('❌ Error in Autocomplete Route:', error);
    return new Response(JSON.stringify({ error: 'Internal Server Error' }), {
      status: 500,
    });
  }
}
