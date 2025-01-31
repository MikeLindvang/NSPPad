import { ObjectId } from 'mongodb';
import dbConnect from '@/lib/dbConnect';
import Project from '@/models/Project';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';

export async function POST(req, context) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), {
        status: 401,
      });
    }

    console.log('✅ Incoming request to create document');
    console.log('🔹 Params received:', context.params);

    const { id: projectId } = await context.params;
    if (!ObjectId.isValid(projectId)) {
      console.error('❌ Invalid project ID:', projectId);
      return new Response(JSON.stringify({ error: 'Invalid project ID' }), {
        status: 400,
      });
    }

    const { title, content } = await req.json();

    if (!title) {
      return new Response(JSON.stringify({ error: 'Missing title' }), {
        status: 400,
      });
    }

    await dbConnect();

    const newDocument = {
      _id: new ObjectId(),
      title,
      content: content || '',
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    const project = await Project.findOneAndUpdate(
      { _id: projectId, userId: session.user.id },
      { $push: { documents: newDocument } },
      { new: true }
    );

    if (!project) {
      return new Response(JSON.stringify({ error: 'Project not found' }), {
        status: 404,
      });
    }

    console.log('✅ New document successfully created:', newDocument);

    return new Response(JSON.stringify(newDocument), {
      status: 201,
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (error) {
    console.error('Error adding document:', error);
    return new Response(JSON.stringify({ error: 'Internal Server Error' }), {
      status: 500,
    });
  }
}
