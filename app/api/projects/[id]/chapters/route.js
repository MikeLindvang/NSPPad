import { ObjectId } from 'mongodb';
import dbConnect from '@/lib/dbConnect';
import Project from '@/models/Project';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';

export async function PATCH(req, { params }) {
  const session = await getServerSession(authOptions);
  if (!session) {
    return new Response(JSON.stringify({ error: 'Unauthorized' }), {
      status: 401,
    });
  }

  const { id: projectId } = params;

  if (!ObjectId.isValid(projectId)) {
    return new Response(JSON.stringify({ error: 'Invalid project ID' }), {
      status: 400,
    });
  }

  const { outline } = await req.json();

  if (!Array.isArray(outline) || outline.length === 0) {
    return new Response(
      JSON.stringify({ error: 'Invalid or missing outline' }),
      {
        status: 400,
      }
    );
  }

  await dbConnect();

  try {
    const newDocs = outline.map((section) => ({
      _id: new ObjectId(),
      title: section.title || 'Untitled Chapter',
      content: '',
      outlineNotes: section.notes || '',
      analysisData: {
        sensoryDetails: '',
        povDepth: '',
        emotionalResonance: '',
        conflict: '',
      },
      analysisScore: {
        depthScores: {
          sensory: 0,
          pov: 0,
          emotional: 0,
          conflict: 0,
        },
      },
      highlights: {},
      createdAt: new Date(),
      updatedAt: new Date(),
    }));

    const updated = await Project.findOneAndUpdate(
      { _id: projectId, userId: session.user.id },
      {
        $push: { documents: { $each: newDocs } },
        $set: { updatedAt: new Date() },
      },
      { new: true }
    );

    if (!updated) {
      return new Response(
        JSON.stringify({ error: 'Project not found or unauthorized' }),
        { status: 404 }
      );
    }

    return new Response(
      JSON.stringify({
        message: 'Chapters created successfully',
        documents: updated.documents,
      }),
      {
        status: 200,
        headers: { 'Content-Type': 'application/json' },
      }
    );
  } catch (err) {
    console.error('Error creating chapter documents:', err);
    return new Response(JSON.stringify({ error: 'Internal Server Error' }), {
      status: 500,
    });
  }
}
