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

    console.log('Project ID:', projectId);

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
        console.log('📚 Project Book Style:', projectStyles.bookStyle?.name);
        projectStyles.authorStyle = project.authorStyleId;
        console.log(
          '✍ Project Author Style:',
          projectStyles.authorStyle?.name
        );
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
  - Writing Rhythm: ${projectStyles.authorStyle.writingRhythm}
  - Word Choice: ${projectStyles.authorStyle.wordChoice}
  - Emotional Depth: ${projectStyles.authorStyle.emotionalDepth}
  - Humor Style: ${projectStyles.authorStyle.humorStyle}
  - Descriptive Level: ${projectStyles.authorStyle.descriptiveLevel}/10
  `;
    }

    if (projectStyles.bookStyle) {
      styleInstructions += `
  📖 **Book Style Preferences**
  - Genre: ${projectStyles.bookStyle.genre}
  - Themes: ${projectStyles.bookStyle.themes.join(', ')}
  - Tone: ${projectStyles.bookStyle.tone}
  - World-Building Depth: ${projectStyles.bookStyle.worldBuildingDepth}
  - Character Focus: ${projectStyles.bookStyle.characterFocus}
  - Plot Complexity: ${projectStyles.bookStyle.plotComplexity}
  `;
    }

    // 🔹 Define Mode-Specific Instructions
    let modeInstructions =
      mode === 'enhance'
        ? `### ✨ Enhance Mode

      💡 You are an expert writing coach, refining the **depth and engagement** of the provided passage while ensuring adherence to the author's unique style.

      🔹 **Enhancement Goals**:
      1. **Deep POV** – Remove distance between the reader and character experience.
      2. **Sensory Details** – Enhance touch, sound, smell, and emotion.
      3. **Emotional Resonance** – Strengthen character emotions and reactions.
      4. **Conflict & Tension** – Intensify engagement and stakes where natural.

      🔹 **DO NOT**:
      🚫 Change the meaning of sentences.
      🚫 Introduce new characters or events.
      🚫 Alter the narrative voice or pacing.

      ${styleInstructions}

      ✍ **STRICT FORMAT REQUIREMENT**:
      🚨 **DO NOT** prefix responses with "Variation 1", "Option 2", "Response 3", etc.
      🚨 **DO NOT** include "Here's a better version" or similar commentary.
      🚨 **DO NOT** return more than THREE (3) sentences.
      ✅ **ONLY return the raw enhanced or continued text**.
      ✅ **Generate exactly THREE distinct responses. Separate them using "###". Do not return fewer or more.**
       ✅ **Example Format**:
          ---
          Enhanced Text 1 ###
          Enhanced Text 2 ###
          Enhanced Text 3
          ---



      📝 **TEXT TO ENHANCE**:
      [FOCUS] ${text}
    `
        : `### 🔮 Continue Mode

        💡 You are an expert storytelling AI, extending the passage **while ensuring seamless narrative flow**. Your goal is to **continue the scene naturally** without disrupting the existing style.

        🔹 **Continuation Goals**:
        1. **Maintain Narrative Voice** – Stay in the author’s chosen style.
        2. **Carry Forward Tension** – Keep existing conflicts active.
        3. **Deepen Engagement** – Ensure sensory and emotional continuity.

        🔹 **DO NOT**:
        🚫 Introduce drastic new plot twists.
        🚫 Change character motivations.
        🚫 Shift the established tone or pacing.

        ${styleInstructions}

        ✍ **STRICT FORMAT REQUIREMENT**:
        🚨 **DO NOT** prefix responses with "Variation 1", "Option 2", "Response 3", etc.
        🚨 **DO NOT** include "Here's a better version" or similar commentary.
        🚨 **DO NOT** return more than THREE (3) sentences.
        ✅ **ONLY return the raw enhanced or continued text**.
        ✅ **Generate exactly THREE distinct responses. Separate them using "###". Do not return fewer or more.**
        ✅ **Example Format**:
          ---
          Continuation 1 ###
          Continuation 2 ###
          Continuation 3
          ---



        📝 **TEXT TO CONTINUE**:
        ${text}
    `;

    // 🔹 Inject Action/Dialogue Modifiers
    if (modifier === 'action') {
      modeInstructions += `
  ### ⚔ Action Boost

💥 **Inject dynamic action into the scene**.
- Use **sharp, high-impact descriptions**.
- Show movement and tension through physical details.
- Maintain character motivation in every action.
  `;
    } else if (modifier === 'dialogue') {
      modeInstructions += `
  ### 🗨 Dialogue Expansion

💬 **Extend the scene with engaging dialogue**.
- Keep character voices **consistent and distinct**.
- Ensure dialogue reflects **existing tensions, emotions, or goals**.
- Balance speech with **action beats and inner thoughts**.
  `;
    }

    console.log('🔍 FINAL PROMPT:', modeInstructions);

    // 🔹 Call OpenAI (GPT-4o-mini for balance between cost & quality)
    const openai = new OpenAI({
      apiKey: process.env.OPENAI_API_KEY,
    });

    const aiResponse = await openai.chat.completions.create({
      model: 'gpt-4o-mini',
      messages: [
        { role: 'system', content: modeInstructions },
        { role: 'user', content: text },
      ],
      max_tokens: 750,
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
