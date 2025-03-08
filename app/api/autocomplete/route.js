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

    // Authenticate User
    const session = await getServerSession(authOptions);
    if (!session) {
      console.log('❌ Unauthorized Access');
      return new Response(JSON.stringify({ error: 'Unauthorized' }), {
        status: 401,
      });
    }

    // Extract Input Data
    const { text, mode, nextStep = '', projectId } = await req.json();
    console.log('🔍 Autocomplete Input:', { text, mode, nextStep, projectId });

    if (!text || text.length < 10 || !mode) {
      return new Response(JSON.stringify({ error: 'Invalid input data' }), {
        status: 400,
      });
    }

    await dbConnect();

    // Fetch Project Styles
    const project = await Project.findOne({
      _id: projectId,
      userId: session.user.id,
    })
      .populate('bookStyleId')
      .populate('authorStyleId');

    const bookStyle =
      project?.bookStyleId ||
      (await BookStyle.findOne({
        userId: session.user.id,
        defaultStyle: true,
      }));
    const authorStyle =
      project?.authorStyleId ||
      (await AuthorStyle.findOne({
        userId: session.user.id,
        defaultStyle: true,
      }));

    console.log('📖 Book Style:', bookStyle?.name || 'Default');
    console.log('✍ Author Style:', authorStyle?.name || 'Default');

    // Build the AI Prompt
    const prompt = buildAIPrompt(text, mode, nextStep, bookStyle, authorStyle);

    console.log('🔍 FINAL AI PROMPT:', prompt);

    // Call OpenAI
    const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
    const aiResponse = await openai.chat.completions.create({
      model: 'gpt-4o-mini',
      messages: [
        { role: 'system', content: prompt },
        { role: 'user', content: text },
      ],
      max_tokens: 750,
      temperature: 0.5,
    });

    console.log('✅ OpenAI Response Received');

    // Parse AI Response and format as HTML paragraphs
    const suggestion = aiResponse.choices[0]?.message?.content.trim() || '';

    // Ensure the output is wrapped in <p> tags for Tiptap formatting
    const formattedSuggestion = suggestion
      .split('\n\n') // Split paragraphs by double line breaks
      .map((paragraph) => `<p>${paragraph.trim()}</p><p></p>`)
      .join('');

    // Return the formatted HTML suggestion
    return new Response(JSON.stringify({ suggestion: formattedSuggestion }), {
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

function buildAIPrompt(text, mode, nextStep, bookStyle, authorStyle) {
  const styleInstructions = getStyleInstructions(bookStyle, authorStyle);
  const modeInstructions = getModeInstructions(mode, nextStep);
  const depthFocus = `
    Prioritize depth through sensory details, emotions, conflict, and deep POV.
    Ensure emotions are shown through subtle cues and body language, avoiding broad statements.
    Maintain the same tone and pacing as the original text.
  `;

  return `
    You are a fiction writing assistant with expertise in maintaining the user's writing style and enhancing depth.
    ${styleInstructions}
    ${modeInstructions}
    ${depthFocus}
    Provide a single response that matches the defined style and adds depth without unnecessary dramatization.
  `;
}

function getStyleInstructions(bookStyle, authorStyle) {
  const instructions = [];

  if (bookStyle?.tone === 'Gritty')
    instructions.push(
      'Use direct, immersive language. Avoid poetic or exaggerated phrasing.'
    );
  if (bookStyle?.pacing === 'Fast-Paced')
    instructions.push(
      'Shorten sentences. Avoid excessive internal monologues.'
    );
  if (bookStyle?.descriptionLevel >= 7)
    instructions.push(
      'Enhance sensory depth, keeping descriptions natural and grounded.'
    );

  if (authorStyle?.sentenceStructure === 'Simple')
    instructions.push('Use concise, straightforward sentences. No fluff.');
  if (authorStyle?.dialogueStyle === 'Snappy & Witty')
    instructions.push('Keep dialogue sharp, natural, and engaging.');
  if (authorStyle?.wordChoice === 'Simple & Direct')
    instructions.push(
      'Use clear, no-frills language. Avoid literary flourishes.'
    );

  return instructions.join('\n');
}

function getModeInstructions(mode, nextStep) {
  if (mode === 'enhance') {
    return `
      ENHANCE MODE:
      - Improve the text without advancing the plot.
      - Keep refinements concise and maintain the original rhythm.
      - Add depth naturally without overloading details.
    `;
  } else if (mode === 'continue') {
    return `
      CONTINUE MODE:
      - Advance the story seamlessly with the same tone and pacing.
      - Maintain character voices and avoid plot twists unless necessary.
      - Add depth through subtle details, emotions, and sensory input.
      - Limit the output to 2-3 paragraphs.
      - Consider the user's input for what happens next: "${nextStep}"
    `;
  }
  return '';
}
