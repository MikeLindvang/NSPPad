import { ObjectId } from 'mongodb';
import dbConnect from '@/lib/dbConnect';
import Project from '@/models/Project';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';

export async function PUT(req, context) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), {
        status: 401,
      });
    }

    const { id } = await context.params;
    console.log('Reordering documents:', id);
    if (!ObjectId.isValid(id)) {
      return new Response(JSON.stringify({ error: 'Invalid project ID' }), {
        status: 400,
      });
    }

    const { documents } = await req.json();

    if (!Array.isArray(documents) || documents.length === 0) {
      return new Response(
        JSON.stringify({ error: 'Invalid document order provided' }),
        { status: 400 }
      );
    }

    await dbConnect();
    const updatedProject = await Project.findOneAndUpdate(
      { _id: id, userId: session.user.id },
      { $set: { documents } },
      { new: true }
    );

    if (!updatedProject) {
      return new Response(
        JSON.stringify({ error: 'Project not found or unauthorized' }),
        { status: 404 }
      );
    }

    return new Response(
      JSON.stringify({
        message: 'Document order updated successfully',
        project: updatedProject,
      }),
      {
        status: 200,
        headers: { 'Content-Type': 'application/json' },
      }
    );
  } catch (error) {
    console.error('Error reordering documents:', error);
    return new Response(JSON.stringify({ error: 'Internal Server Error' }), {
      status: 500,
    });
  }
}
