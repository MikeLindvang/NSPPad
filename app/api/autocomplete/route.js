import { getServerSession } from 'next-auth';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';
import { OpenAI } from 'openai';
import dbConnect from '@/lib/dbConnect';
import Project from '@/models/Project';
import AuthorStyle from '@/models/AuthorStyle';
import BookStyle from '@/models/BookStyle';
import { authorStyleOptions } from '../../../lib/authorStyleOptions';
import { optionDescriptions as bookStyleOptions } from '../../../lib/bookStyleOptions';

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
    const { text, mode, modifier = null, projectId } = await req.json();
    console.log('🔍 Autocomplete Input:', { text, mode, modifier, projectId });

    if (!text || text.length < 10 || !mode) {
      return new Response(JSON.stringify({ error: 'Invalid input data' }), {
        status: 400,
      });
    }

    // 🔹 Connect to Database
    await dbConnect();

    // 🔹 Fetch Project Styles (or Default Styles)
    let projectStyles = { bookStyle: null, authorStyle: null };

    if (projectId) {
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

    console.log('📖 Book Style:', projectStyles.bookStyle?.name || 'Default');
    console.log(
      '✍ Author Style:',
      projectStyles.authorStyle?.name || 'Default'
    );

    // 🔹 Extract & Prioritize Key Style Constraints
    const prioritizeStyle = (bookStyle, authorStyle) => {
      let emphasis = [];

      // 🔹 Book Style Constraints
      if (bookStyle.tone === 'Gritty')
        emphasis.push(
          'Use direct, immersive language. Avoid poetic descriptions or exaggerated phrasing.'
        );
      if (bookStyle.tone === 'Lighthearted')
        emphasis.push('Maintain a warm, casual tone with natural humor.');
      if (bookStyle.pacing === 'Fast-Paced')
        emphasis.push(
          'Shorten sentences. Avoid excessive internal monologues.'
        );
      if (bookStyle.descriptionLevel <= 4)
        emphasis.push('Keep descriptions minimal. No unnecessary detail.');
      if (bookStyle.descriptionLevel >= 7)
        emphasis.push(
          'Enhance sensory depth, but **keep it natural and grounded in the character’s perspective.**'
        );

      // 🔹 Author Style Constraints
      if (authorStyle.sentenceStructure === 'Simple')
        emphasis.push('Use concise, straightforward sentences. No fluff.');
      if (authorStyle.sentenceStructure === 'Choppy & Fragmented')
        emphasis.push('Use short, snappy sentences.');
      if (authorStyle.sentenceStructure === 'Poetic & Flowing')
        emphasis.push(
          'Ensure elegant, rhythmic prose without over-exaggeration.'
        );
      if (authorStyle.dialogueStyle === 'Snappy & Witty')
        emphasis.push('Keep dialogue **sharp, natural, and engaging**.');
      if (authorStyle.wordChoice === 'Simple & Direct')
        emphasis.push(
          'Use clear, no-frills language. Avoid literary flourishes.'
        );
      if (authorStyle.wordChoice === 'Evocative & Lyrical')
        emphasis.push(
          'Ensure poetic, emotionally resonant descriptions **without sacrificing clarity.**'
        );

      // 🔹 New Constraint to Control Overly Dramatic AI Outputs
      emphasis.push(
        '🚨 **Avoid excessive dramatization or overly poetic rewording.** ' +
          'Emotions should be **felt through small details and body language, NOT broad statements.** ' +
          'Example: Instead of "The place suffocated him," show discomfort through posture, expression, or sensory details.'
      );

      return emphasis.join('\n');
    };

    const styleRules = prioritizeStyle(
      projectStyles.bookStyle,
      projectStyles.authorStyle
    );

    // 🔹 Define Mode Instructions
    let modeInstructions = `
  🚀 AI Writing Mode: ${mode.toUpperCase()}
  ${styleRules}

  🚨 **STRICT RULES FOR OUTPUT** 🚨
  - **Maintain natural depth** without over-complicating the prose.
  - **Avoid forced poetic phrasing** unless explicitly required by style.
  - **NO dramatic rewording.** Keep emotions subtle and character-driven.
  - **Ensure sensory details feel organic**, not exaggerated.
  - **Sentence flow must match the given writing style.**
  - **Simpler is better** when clarity is needed.
  
  🔍 **SELF-CHECK BEFORE OUTPUT:**
  ✅ Does this match the intended writing style? (YES/NO)
  ✅ Does it sound **natural and not overly complicated**? (YES/NO)
  ✅ Does it **include depth through sensory details** without excessive length? (YES/NO)
  ✅ Does it maintain the right **pacing and tone**? (YES/NO)
  ❌ **IF ANY ANSWER IS NO, REWRITE IT.**

  🚨 **YOU MUST RETURN EXACTLY THREE VARIATIONS** 🚨  
  - **Separate each version with "###"**  
  - **Each version should maintain the same style, but offer slightly different takes**  
  - **IF YOU FAIL TO RETURN THREE VARIATIONS, YOU MUST REWRITE IT.**  

  ✍ **OUTPUT FORMAT (NO EXCEPTIONS):**  
  Variation 1 ###  
  Variation 2 ###  
  Variation 3  

  DO NOT ACTUALLY WRITE "Variation 1" etc. Just separate each version with "###"
  `;

    if (mode === 'enhance') {
      modeInstructions += `
        ✨ ENHANCE MODE RULES:
        - Improve the text **without changing its core meaning.**
        - **DO NOT** add extra sentences or unnecessary exposition.
        + Keep refinements concise, but allow slight expansions if needed to capture character perspective.
        - Maintain the **original rhythm** of the sentence.
        - If the text lacks sensory depth, **enhance naturally without overloading.**
      `;
    } else if (mode === 'continue') {
      modeInstructions += `
        🔮 CONTINUE MODE RULES:
        - Continue the passage **seamlessly** with the same tone and pacing.
        - **DO NOT** introduce new plot twists **unless contextually necessary.**
        - Keep character voices **consistent** with prior writing.
      `;
    }

    if (modifier === 'action') {
      modeInstructions += `
        ⚔ ACTION BOOST:
        - Inject dynamic action into the scene.
        - Use **sharp, high-impact descriptions**.
        - Show movement and tension through physical details.
      `;
    } else if (modifier === 'dialogue') {
      modeInstructions += `
        🗨 DIALOGUE EXPANSION:
        - Extend the scene with **engaging dialogue**.
        - Keep character voices **distinct and natural**.
      `;
    }

    console.log('🔍 FINAL AI PROMPT:', modeInstructions);

    // 🔹 Call OpenAI
    const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

    const aiResponse = await openai.chat.completions.create({
      model: 'gpt-4o-mini',
      messages: [
        { role: 'system', content: modeInstructions },
        {
          role: 'user',
          content: `Provide three variations of the following: ${text}
          `,
        },
      ],
      max_tokens: 750,
    });

    console.log('✅ OpenAI Response Received');

    // 🔹 Format AI Response
    const rawSuggestions = aiResponse.choices[0]?.message?.content || '';
    let suggestions = rawSuggestions
      .split('###')
      .map((s) => s.trim())
      .filter(Boolean);

    // 🚨 If we somehow only get one suggestion, create slight variations
    if (suggestions.length < 3) {
      console.warn(
        '⚠ GPT-4o-mini did not return three variations. Generating alternatives.'
      );
      suggestions = [rawSuggestions];
    }

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
