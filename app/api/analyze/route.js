import dbConnect from '@/lib/dbConnect';
import Project from '@/models/Project';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';
import { ObjectId } from 'mongodb';
import { OpenAI } from 'openai';

export async function POST(req) {
  try {
    const session = await getServerSession(authOptions);

    if (!session) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), {
        status: 401,
      });
    }

    const { projectId, docId, text } = await req.json();

    if (!projectId || !docId || !text || text.length < 50) {
      return new Response(JSON.stringify({ error: 'Invalid input data' }), {
        status: 400,
      });
    }

    if (!ObjectId.isValid(projectId) || !ObjectId.isValid(docId)) {
      return new Response(
        JSON.stringify({ error: 'Invalid project or document ID' }),
        { status: 400 }
      );
    }

    await dbConnect();

    const project = await Project.findOne({
      _id: projectId,
      userId: session.user.id,
    });

    if (!project) {
      return new Response(
        JSON.stringify({ error: 'Project not found or unauthorized' }),
        { status: 404 }
      );
    }

    const document = project.documents.find(
      (doc) => doc._id.toString() === docId
    );

    if (!document) {
      return new Response(
        JSON.stringify({ error: 'Document not found in project' }),
        { status: 404 }
      );
    }

    const openai = new OpenAI({
      apiKey: process.env.OPENAI_API_KEY,
    });

    // AI Request: Sidebar Analysis Feedback
    const sidebarResponse = await openai.chat.completions.create({
      model: 'gpt-4',
      messages: [
        {
          role: 'system',
          content: `Analyze the following text based on these four key elements:
          1. Sensory Details: Does the text engage the five senses?
          2. Deep POV: Is the narrative immersive without filtering words?
          3. Emotional Resonance: Are character emotions effectively conveyed?
          4. Conflict: Are stakes and conflicts clearly defined?
          
          Provide actionable feedback and improvement suggestions for each.
          Use the exact format: 
          Sensory Details: [feedback]
          Deep POV: [feedback]
          Emotional Resonance: [feedback]
          Conflict: [feedback]`,
        },
        { role: 'user', content: text },
      ],
      max_tokens: 500,
    });

    console.log(
      'Sidebar Response:',
      sidebarResponse.choices[0]?.message?.content
    );

    let sidebarFeedback = sidebarResponse.choices[0]?.message?.content || '';

    // 🔹 **Fix: Ensure Sidebar Feedback is Structured Properly**
    const analysisResults = {};
    const feedbackLines = sidebarFeedback.trim().split('\n');

    feedbackLines.forEach((line) => {
      const [key, ...valueParts] = line.split(':');
      if (key && valueParts.length) {
        let formattedKey = key.trim().toLowerCase().replace(/\s+/g, '');

        // Rename "Conflict and Tension" to "Conflict"
        if (
          formattedKey === 'conflictandtension' ||
          formattedKey === 'conflict'
        ) {
          formattedKey = 'conflict';
        }

        analysisResults[formattedKey] = valueParts.join(':').trim();
      }
    });

    // AI Request: Depth Score Analysis (Consistent with Sidebar Elements)
    const scoreResponse = await openai.chat.completions.create({
      model: 'gpt-4',
      messages: [
        {
          role: 'system',
          content: `Evaluate the text on a scale from 1 to 100 for each of the following categories:
          1. Sensory Details
          2. Deep POV
          3. Emotional Resonance
          4. Conflict
          
          Provide only the scores in the format:
          Sensory Details: X
          Deep POV: X
          Emotional Resonance: X
          Conflict: X`,
        },
        { role: 'user', content: text },
      ],
      temperature: 0.5,
    });

    const depthScoreRaw = scoreResponse.choices[0]?.message?.content || '';

    // Convert Depth Score into a structured object
    const depthScores = {};
    depthScoreRaw.split('\n').forEach((line) => {
      const [key, value] = line.split(':');
      if (key && value) {
        let formattedKey = key.trim().toLowerCase().replace(/\s+/g, '');

        // Rename "Conflict and Tension" to "Conflict"
        if (
          formattedKey === 'conflictandtension' ||
          formattedKey === 'conflict'
        ) {
          formattedKey = 'conflict';
        }

        depthScores[formattedKey] = parseInt(value.trim()) || 0;
      }
    });

    // AI Request: Inline Feedback (Consistent with Sidebar Elements)
    const inlineResponse = await openai.chat.completions.create({
      model: 'gpt-4',
      messages: [
        {
          role: 'system',
          content: `Highlight specific words, phrases, or paragraphs that need improvement in these four areas:
          1. Sensory Details
          2. Deep POV
          3. Emotional Resonance
          4. Conflict
          
          For each highlighted issue, provide a suggested improvement and an explanation.`,
        },
        { role: 'user', content: text },
      ],
      temperature: 0.6,
    });

    const inlineFeedback = inlineResponse.choices[0]?.message?.content || '';

    // 🔹 **Fix: Store Sidebar Feedback as an Object in `analysisData`**
    document.analysisData = {
      sensoryDetails: analysisResults['sensorydetails'] || '',
      povDepth: analysisResults['deeppov'] || '',
      emotionalResonance: analysisResults['emotionalresonance'] || '',
      conflict: analysisResults['conflict'] || '', // ✅ Now just "conflict"
    };

    document.analysisScore = {
      depthScores: {
        sensory: depthScores['sensorydetails'] || 0,
        pov: depthScores['deeppov'] || 0,
        emotional: depthScores['emotionalresonance'] || 0,
        conflict: depthScores['conflict'] || 0, // ✅ Now just "conflict"
      },
    };

    document.inlineFeedback = inlineFeedback;
    document.updatedAt = new Date();

    await project.save();

    return new Response(
      JSON.stringify({
        message: 'Analysis completed successfully',
        analysisData: document.analysisData,
        analysisScore: document.analysisScore,
        inlineFeedback,
      }),
      { status: 200, headers: { 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    console.error('Error analyzing text:', error);
    return new Response(JSON.stringify({ error: 'Internal Server Error' }), {
      status: 500,
    });
  }
}
