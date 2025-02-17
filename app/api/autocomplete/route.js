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

    const getAuthorStyleOptions = (category, value) => {
      if (!value) return 'No description available';
      return authorStyleOptions[category][value] || 'No description available';
    };
    const getBookStyleOptions = (category, value) => {
      if (!value) return 'No description available';
      return bookStyleOptions[category][value] || 'No description available';
    };

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
  - Narrative Voice: ${
    projectStyles.authorStyle.narrativeVoice
  } - ${getAuthorStyleOptions(
        'narrativeVoice',
        projectStyles.authorStyle.narrativeVoice
      )}
  - Sentence Structure: ${
    projectStyles.authorStyle.sentenceStructure
  } - ${getAuthorStyleOptions(
        'sentenceStructure',
        projectStyles.authorStyle.sentenceStructure
      )}
  - Formality: ${projectStyles.authorStyle.formality} - ${getAuthorStyleOptions(
        'formality',
        projectStyles.authorStyle.formality
      )}
  - Use of Metaphors: ${
    projectStyles.authorStyle.useOfMetaphors
  } - ${getAuthorStyleOptions(
        'useOfMetaphors',
        projectStyles.authorStyle.useOfMetaphors
      )}
  - Pacing: ${
    projectStyles.authorStyle.pacingPreference
  } - ${getAuthorStyleOptions(
        'pacingPreference',
        projectStyles.authorStyle.pacingPreference
      )}
  - Dialogue Style: ${
    projectStyles.authorStyle.dialogueStyle
  } - ${getAuthorStyleOptions(
        'dialogueStyle',
        projectStyles.authorStyle.dialogueStyle
      )}
  - Writing Rhythm: ${
    projectStyles.authorStyle.writingRhythm
  } - ${getAuthorStyleOptions(
        'writingRhythm',
        projectStyles.authorStyle.writingRhythm
      )}
  - Word Choice: ${
    projectStyles.authorStyle.wordChoice
  } - ${getAuthorStyleOptions(
        'wordChoice',
        projectStyles.authorStyle.wordChoice
      )}
  - Emotional Depth: ${
    projectStyles.authorStyle.emotionalDepth
  } - ${getAuthorStyleOptions(
        'emotionalDepth',
        projectStyles.authorStyle.emotionalDepth
      )}
  - Humor Style: ${
    projectStyles.authorStyle.humorStyle
  } - ${getAuthorStyleOptions(
        'humorStyle',
        projectStyles.authorStyle.humorStyle
      )}
  - Descriptive Level: ${
    projectStyles.authorStyle.descriptiveLevel
  }/10 - ${getAuthorStyleOptions(
        'humorStyle',
        projectStyles.authorStyle.descriptiveLevel
      )}
  - **IF YOU FAIL TO FOLLOW THESE RULES, YOU MUST REWRITE THE OUTPUT UNTIL IT COMPLIES.**  
  `;
    }

    if (projectStyles.bookStyle) {
      styleInstructions += `
  📖 **Book Style Preferences**
  - Genre: ${projectStyles.bookStyle.genre}
  - Themes: ${projectStyles.bookStyle.themes.join(', ')}
  - Tone: ${projectStyles.bookStyle.tone} - ${getBookStyleOptions(
        'tone',
        projectStyles.bookStyle.tone
      )}
  - World-Building Depth: ${
    projectStyles.bookStyle.worldBuildingDepth
  } - ${getBookStyleOptions(
        'worldBuildingDepth',
        projectStyles.bookStyle.worldBuildingDepth
      )}
  - Character Focus: ${
    projectStyles.bookStyle.characterFocus
  } - ${getBookStyleOptions(
        'characterFocus',
        projectStyles.bookStyle.characterFocus
      )}
  - Plot Complexity: ${
    projectStyles.bookStyle.plotComplexity
  } - ${getBookStyleOptions(
        'plotComplexity',
        projectStyles.bookStyle.plotComplexity
      )}
  - **IF YOU FAIL TO FOLLOW THESE RULES, YOU MUST REWRITE THE OUTPUT UNTIL IT COMPLIES.**  
  `;
    }

    // 🔹 Define Mode-Specific Instructions
    let modeInstructions =
      mode === 'enhance'
        ? `### ✨ Enhance Mode

💡 **ROLE:** You are a **precision-focused literary editor**.  
Your sole mission is to enhance the provided passage **without altering its fundamental structure** while **STRICTLY adhering** to the **author and book style preferences**.  

🚨 **CRITICAL RULES - DO NOT IGNORE** 🚨  
- **DO NOT** introduce new characters, events, or story shifts.  
- **DO NOT** add unnecessary flourishes—strictly follow the given writing style.  
- **DO NOT** break pacing. **Sentence rhythm and structure MUST match the original.**  
- **YOU MUST** refine emotional depth, **but within the author’s specific narrative voice.**  
- **IF YOU FAIL TO FOLLOW THESE RULES, YOU MUST REWRITE THE OUTPUT UNTIL IT COMPLIES.**  

${styleInstructions}

🔹 **STEP-BY-STEP EXECUTION (Follow in Order)**:
1️⃣ **Analyze the original passage** to understand its rhythm, word choice, and emotional tone.  
2️⃣ **Identify weak areas** that lack depth (sensory details, conflict, emotional weight).  
3️⃣ **Rewrite the passage** by subtly improving its impact **while maintaining the exact style.**  
4️⃣ **Double-check your response** against the original. **IF IT BREAKS THE STYLE, REWRITE IT.**  

🔍 **Self-Check Before Output**  
✅ Is the style **exactly** matched? (YES/NO)  
✅ Did you add **only necessary** sensory and emotional depth? (YES/NO)  
✅ Did you maintain the **exact same sentence structure & pacing**? (YES/NO)   
❌ **If any answer is NO, start over and fix it.**  

✍ **STRICT OUTPUT FORMAT - NO EXCEPTIONS**  
- **DO NOT** prefix responses with "Variation 1", "Option 2", etc.  
- **DO NOT** explain changes—**only return the enhanced text.**  
- **You MUST provide three enhanced versions**, **separated by "###".**  
- **Each version MUST be a maximum of 3 sentences.** 
- ***Provide the 3 variations in the following format:***
      Enhanced Text 1 ###
      Enhanced Text 2 ###
      Enhanced Text 3
**IF THE ABOVE FORMAT IS NOT FOLLOWED, YOU MUST REWRITE THE OUTPUT UNTIL IT COMPLIES.**

📝 **TEXT TO ENHANCE**:  
[FOCUS] ${text}

      `
        : `### 🔮 Continue Mode

💡 **ROLE:** You are a **narrative flow expert**.  
Your job is to **seamlessly extend** the provided passage **without breaking** the established writing style.  

🚨 **STRICT RULES - DO NOT BREAK THESE** 🚨  
- **YOU MUST FOLLOW THE AUTHOR & BOOK STYLE EXACTLY.**  
- **DO NOT** introduce sudden plot twists—continue the existing narrative.  
- **DO NOT** introduce new characters—continue the existing narrative.  
- **DO NOT** alter character personalities, motivations, or established tone.  
- **DO NOT** overwrite—**KEEP SENTENCES CONCISE AND PACE CONSISTENT.**  
- **IF YOU FAIL TO FOLLOW THESE RULES, YOU MUST REWRITE THE OUTPUT UNTIL IT COMPLIES.**  

${styleInstructions}

🔹 **STEP-BY-STEP EXECUTION (Follow in Order)**:
1️⃣ **Analyze the last few sentences** to ensure continuity.  
2️⃣ **Identify the natural next step** in the scene—**DO NOT introduce forced action.**  
3️⃣ **Write a seamless continuation** that fits naturally.  
4️⃣ **Double-check your response** against the previous text. **IF IT BREAKS THE STYLE, REWRITE IT.**  

🔍 **Self-Check Before Output**  
✅ Is the style **exactly** matched? (YES/NO)  
✅ Does the continuation feel **seamless and unforced**? (YES/NO)  
✅ Is the pacing & sentence structure **identical to prior context**? (YES/NO)  
❌ **If any answer is NO, start over and fix it.**  

✍ **STRICT OUTPUT FORMAT - NO EXCEPTIONS**  
- **DO NOT** prefix responses with "Variation 1", "Option 2", etc.  
- **DO NOT** explain changes—**only return the continued text.**  
- **You MUST provide three continuations**, **separated by "###".**  
- **Each continuation MUST be a maximum of 3 sentences.**  

- ***Provide the 3 variations in the following format:***
      Continuation 1 ###
      Continuation 2 ###
      Continuation 3
**IF THE ABOVE FORMAT IS NOT FOLLOWED, YOU MUST REWRITE THE OUTPUT UNTIL IT COMPLIES.**

📝 **TEXT TO CONTINUE**:  
${text}

      `;

    // 🔹 Inject Unified Mode Instructions
    modeInstructions += `
🚨 **STRICT RULES FOR STYLE & STRUCTURE** 🚨  

🔹 **Match Drama & Description to Genre**  
- **DO NOT** exaggerate tension, stakes, or emotions **beyond what fits the story’s tone**.  
- **Use metaphors, poetic phrasing, and stylization sparingly**—only where it **enhances clarity or emotion**.  
- **Keep tension and atmosphere grounded** in the POV character’s direct experience.  

🔹 **Maintain Consistent POV**  
- **DO NOT** assume a new POV character unless explicitly stated.  
- If the **POV character is not mentioned in a sentence, assume they remain the same**.  
- **All internal thoughts, perceptions, and emotions MUST belong to the established POV character.**  
- Other characters' emotions or thoughts **should ONLY be inferred** from their actions or dialogue.  

❌ **Avoid POV Confusion:**  
Bad: *Max glanced at Gus. He weighed his options carefully, unsure if this was the right call.* *(Who is “he”? Could be either Max or Gus—unclear.)*  
✅ **Instead:** *Max glanced at Gus, considering his options carefully. Gus seemed unreadable, offering no hint as to what he was thinking.* *(Ensures Max remains the POV character.)*  

🔹 **Sentence Structure & Readability**  
- **Mix long and short sentences** to keep a natural flow—**NO repetitive structures**.  
- **DO NOT** start multiple sentences in a row with dependent clauses (e.g., "With...", "After...", "That meant...").  

🔹 **Remove Filtering Words ("He Knew", "He Figured")**  
- **DO NOT** overuse filter words like "he knew", "he figured", "he thought".  
- **Instead, state the fact or action directly.**  

🔹 **Trust the Reader (Avoid Redundant Explanations)**  
- **DO NOT** over-explain or restate obvious details. The reader can infer meaning.  

🔹 **Avoid Predictable Scene Resets**  
- **DO NOT** always return to the main goal after an interlude—**vary pacing with interruptions, distractions, or external tension.**  

🔹 **Genre-Specific Adaptation**  
- **Follow the genre’s natural tone.** Avoid unnecessary **${projectStyles.bookStyle.genre} dramatization** unless explicitly required.  
- **For action-heavy scenes, favor short, direct sentences.**  
- **For introspective scenes, ensure emotional depth without unnecessary embellishment.**  
`;

    // 🔹 Inject Action/Dialogue Modifiers
    if (modifier === 'action') {
      modeInstructions += `
  ### ⚔ Action Boost

💥 **Inject dynamic action into the scene**.
- Use **sharp, high-impact descriptions**.
- Show movement and tension through physical details.
- Maintain character motivation in every action.
- Maintain conflict and POV depth in every action.

Self-Check Before Output
✅ Is the action **dynamic and engaging**? (YES/NO)
✅ Does every action **advance the plot or character arc**? (YES/NO)
✅ Is the pacing **fast and engaging**? (YES/NO)
**IF ANY ANSWER IS NO, START OVER AND FIX IT.**
  `;
    } else if (modifier === 'dialogue') {
      modeInstructions += `
  ### 🗨 Dialogue Expansion

💬 **Extend the scene with engaging dialogue**.
- Keep character voices **consistent and distinct**.
- Ensure dialogue reflects **existing tensions, emotions, or goals**.
- Balance speech with **action beats and inner thoughts**.

Self-Check Before Output
✅ Is the dialogue **engaging and character-driven**? (YES/NO)
✅ Does each line **reveal character depth or advance the plot**? (YES/NO)
✅ Is the pacing **natural and engaging**? (YES/NO)
**IF ANY ANSWER IS NO, START OVER AND FIX IT.**
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
