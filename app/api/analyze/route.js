import { OpenAI } from 'openai';

export async function POST(req) {
  try {
    const { text } = await req.json();

    if (!text || text.length < 50) {
      return new Response(
        JSON.stringify({ error: 'Text too short for analysis' }),
        {
          status: 400,
        }
      );
    }

    const openai = new OpenAI({
      apiKey: process.env.OPENAI_API_KEY, // Ensure your API key is set in .env.local
    });

    const response = await openai.chat.completions.create({
      model: 'gpt-4', // Ensure you're using a chat-compatible model
      messages: [
        {
          role: 'system',
          content: `You are an expert editor. Analyze the following text for depth based on these criteria:
          1. Sensory Details: Does the text engage the five senses?
          2. Deep POV: Is the narrative immersive without filtering words?
          3. Emotional Resonance: Are character emotions effectively conveyed?
          4. Conflict and Tension: Are stakes and conflicts clearly defined?.
          
          You will suggest and provide examples of improvements.`,
        },
        {
          role: 'user',
          content: text,
        },
      ],
      max_tokens: 400,
    });

    const suggestions =
      response.choices[0]?.message?.content.trim().split('\n') || [];

    return new Response(JSON.stringify({ suggestions }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (error) {
    console.error('Error analyzing text:', error);
    return new Response(JSON.stringify({ error: 'Internal Server Error' }), {
      status: 500,
    });
  }
}
