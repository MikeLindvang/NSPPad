import { OpenAI } from 'openai';

export async function POST(req) {
  try {
    console.log('✅ Received Paragraph Analysis Request');

    const { text } = await req.json();

    if (!text || text.length < 10) {
      return new Response(JSON.stringify({ error: 'Invalid input data' }), {
        status: 400,
      });
    }

    const openai = new OpenAI({
      apiKey: process.env.OPENAI_API_KEY,
    });

    console.log('🔍 Sending Paragraph Analysis Request...');
    const response = await openai.chat.completions.create({
      model: 'gpt-4o-mini',
      messages: [
        {
          role: 'system',
          content: `Provide 3 to 5 specific, one-line suggestions to improve the given paragraph. 
                    The suggestions should be concrete, focusing on enhancing depth, clarity, and engagement. 
                    Avoid generic advice. **A strong emphasis should be placed on EMOTIONAL and SENSORY** depth 
                    with concrete examples of how to improve the text. Each suggestion should be actionable, 
                    to the point and **SHORT**. 
                     
                    Return the suggestions as an HTML list with no additional explanation or markdown. 
                    Use this exact format:

                    <ul>
                      <li>First specific suggestion.</li>
                      <li>Second specific suggestion.</li>
                      <li>Third specific suggestion.</li>
                    </ul>`,
        },
        { role: 'user', content: text },
      ],
      max_tokens: 100,
      temperature: 0.7,
    });

    const analysisHtml = response.choices[0]?.message?.content?.trim() || '';

    console.log('✅ Analysis Response:', analysisHtml);

    return new Response(JSON.stringify({ analysisHtml }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (error) {
    console.error('❌ Error in Paragraph Analysis Route:', error);
    return new Response(JSON.stringify({ error: 'Internal Server Error' }), {
      status: 500,
    });
  }
}
