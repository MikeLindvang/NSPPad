import { getServerSession } from 'next-auth';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';
import { OpenAI } from 'openai';

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
    const { text, mode, modifier = null } = await req.json(); // ✅ Ensure modifier is always defined
    console.log('🔍 Autocomplete Input:', { text, mode, modifier });

    // 🔹 Validate Input
    if (!text || text.length < 10 || !mode) {
      console.log('❌ Invalid Input Data');
      return new Response(JSON.stringify({ error: 'Invalid input data' }), {
        status: 400,
      });
    }

    // 🔹 Base Instructions for Enhancement or Continuation
    let modeInstructions =
      mode === 'enhance'
        ? `You are an expert writing coach improving storytelling depth. Focus on refining the following text while enhancing one or more of these elements:

        1. **Sensory Details** – Use vivid descriptions involving sight, sound, touch, taste, or smell.
        2. **Deep POV** – Immerse the reader fully in the character’s emotions and experiences.
        3. **Emotional Resonance** – Ensure the writing evokes strong emotions from the character and the reader.
        4. **Conflict** – Increase stakes, tension, or internal struggle.

        Enhance the provided text while maintaining style and tone. Return three variations, separated by "###".`
        : `You are an expert storytelling AI. Generate three distinct ways to **continue** this text while ensuring a smooth flow. Maintain the tone and style of the passage.
        
        Return three variations, separated by "###".`;

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
      model: 'gpt-4o-mini',
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
