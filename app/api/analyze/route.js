import { OpenAI } from 'openai';
import dbConnect from '@/lib/dbConnect';
import Project from '@/models/Project';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';
import { ObjectId } from 'mongodb';

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
        {
          status: 404,
        }
      );
    }

    const document = project.documents.find(
      (doc) => doc._id.toString() === docId
    );

    if (!document) {
      return new Response(
        JSON.stringify({ error: 'Document not found in project' }),
        {
          status: 404,
        }
      );
    }

    const openai = new OpenAI({
      apiKey: process.env.OPENAI_API_KEY, // Ensure your API key is set in .env.local
    });

    const response = await openai.chat.completions.create({
      model: 'gpt-4',
      messages: [
        {
          role: 'system',
          content: `You are an expert editor. Analyze the following text for depth based on these criteria:
          1. Sensory Details: Does the text engage the five senses?
          2. Deep POV: Is the narrative immersive without filtering words?
          3. Emotional Resonance: Are character emotions effectively conveyed?
          4. Conflict and Tension: Are stakes and conflicts clearly defined?
          
          Provide actionable feedback and improvement suggestions.`,
        },
        {
          role: 'user',
          content: text,
        },
      ],
      max_tokens: 500,
    });

    const analysisResults =
      response.choices[0]?.message?.content.trim().split('\n') || [];

    // Dynamically process results into an object
    const feedback = analysisResults.reduce((acc, line, index) => {
      const [key, ...value] = line.split(':');
      acc[key?.trim()] = value.join(':').trim();
      return acc;
    }, {});

    // Generate an analysis score
    const analysisScore = Math.min(100, Math.round(text.length / 10));

    // Update the specific document
    document.analysisData = {
      sensoryDetails: feedback['Sensory Details'] || '',
      povDepth: feedback['Deep POV'] || '',
      emotionalResonance: feedback['Emotional Resonance'] || '',
      conflictTension: feedback['Conflict and Tension'] || '',
    };
    document.analysisScore = analysisScore;
    document.updatedAt = new Date();

    await project.save();

    return new Response(
      JSON.stringify({
        message: 'Analysis completed successfully',
        analysisData: document.analysisData,
        analysisScore,
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
