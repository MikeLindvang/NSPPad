import dbConnect from '@/lib/dbConnect';
import Project from '@/models/Project';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';
import { ObjectId } from 'mongodb';

export async function GET(req) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), {
        status: 401,
      });
    }

    await dbConnect();

    const projects = await Project.find({ userId: session.user.id })
      .sort({ updatedAt: -1 }) // Sort by updatedAt (newest first)
      .lean();

    return new Response(JSON.stringify(projects), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (error) {
    console.error('Error fetching projects:', error);
    return new Response(JSON.stringify({ error: 'Internal Server Error' }), {
      status: 500,
    });
  }
}

export async function POST(req) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), {
        status: 401,
      });
    }

    const { title = 'Untitled Project' } = await req.json();

    await dbConnect();

    const defaultDocument = {
      id: new ObjectId().toString(),
      title: 'Untitled Document',
      content: 'Write your content here...',
      analysisData: {
        sensoryDetails: '',
        povDepth: '',
        emotionalResonance: '',
        conflictAndTension: '',
      },
      analysisScore: 0,
    };
    console.log('DEFAULTDOCUMENT: ', defaultDocument);

    const newProject = await Project.create({
      title,
      userId: session.user.id,
      documents: [defaultDocument], // Add default document
      createdAt: new Date(),
      updatedAt: new Date(),
    });

    return new Response(JSON.stringify(newProject), {
      status: 201,
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (error) {
    console.error('Error creating project:', error);
    return new Response(JSON.stringify({ error: 'Internal Server Error' }), {
      status: 500,
    });
  }
}
