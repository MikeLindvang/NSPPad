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
    const { text, mode } = await req.json();
    console.log('🔍 Autocomplete Input Text:', text, '| Mode:', mode);

    // 🔹 Validate Input
    if (!text || text.length < 10) {
      console.log('❌ Invalid Input Data');
      return new Response(JSON.stringify({ error: 'Invalid input text' }), {
        status: 400,
      });
    }

    // 🔹 Call OpenAI (GPT-3.5-Turbo)
    const openai = new OpenAI({
      apiKey: process.env.OPENAI_API_KEY,
    });

    console.log('🔍 Sending Request to OpenAI...');

    // ✅ Adjust prompt based on mode
    const systemMessage =
      mode === 'enhance'
        ? `You are an expert writing coach focused on improving storytelling depth. Enhance the following text by improving one or more of these:
        
        1. **Sensory Details** – Use vivid descriptions involving sight, sound, touch, taste, or smell.
        2. **Deep POV** – Immerse the reader fully in the character’s emotions and experiences.
        3. **Emotional Resonance** – Ensure the writing evokes strong emotions from the character and the reader.
        4. **Conflict** – Increase stakes, tension, or internal struggle.

        Enhance the passage while keeping the core idea intact. Provide three improved versions, separated by "###".`
        : `You are a writing assistant that enhances depth in storytelling. Given a short snippet of text, generate three distinct ways the user might continue the passage while improving one or more of the following:
        
        1. **Sensory Details** – Use vivid descriptions involving sight, sound, touch, taste, or smell.
        2. **Deep POV** – Immerse the reader fully in the character’s emotions and experiences.
        3. **Emotional Resonance** – Ensure the writing evokes strong emotions from the character and the reader.
        4. **Conflict** – Increase stakes, tension, or internal struggle.

        Each response should **build on the snippet in a meaningful way** while following the depth guidelines. Separate responses clearly with "###".`;

    const aiResponse = await openai.chat.completions.create({
      model: 'gpt-3.5-turbo',
      messages: [
        { role: 'system', content: systemMessage },
        { role: 'user', content: text },
      ],
      max_tokens: 200, // Allow slightly more space for depth
      temperature: 0.7, // Balanced creativity
    });

    console.log('✅ OpenAI Response Received');

    // 🔹 Ensure the AI response is properly split
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
