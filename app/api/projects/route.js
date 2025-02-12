import { ObjectId } from 'mongodb';
import dbConnect from '@/lib/dbConnect';
import Project from '@/models/Project';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';

export async function GET(req) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), {
        status: 401,
      });
    }

    await dbConnect();
    console.log('✅ Connected to MongoDB');
    console.log('🔹 User ID from session:', session.user.id);

    // 🔍 Log the user ID type to confirm it's a string
    console.log('🔍 Type of session.user.id:', typeof session.user.id);

    // 🔥 FORCE userId TO BE A STRING TO AVOID TYPE MISMATCH
    const userIdString = String(session.user.id);

    // 🔍 Fetch projects where userId exactly matches the session user ID
    const projects = await Project.find({ userId: userIdString })
      .sort({ updatedAt: -1 })
      .lean();

    console.log('🔹 Projects Found:', projects.length);

    return new Response(JSON.stringify(projects), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (error) {
    console.error('❌ Error fetching projects:', error);
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

    // ✅ Use _id instead of id for consistency with MongoDB expectations
    const defaultDocument = {
      _id: new ObjectId(), // ✅ Keeping it as ObjectId
      title: 'Untitled Document',
      content: 'Write your content here...',
      analysisData: {
        sensoryDetails: '',
        povDepth: '',
        emotionalResonance: '',
        conflictAndTension: '',
      },
      analysisScore: 0,
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    const newProject = await Project.create({
      title,
      userId: new ObjectId(session.user.id), // ✅ Ensure userId is stored correctly
      documents: [defaultDocument], // Add default document
      createdAt: new Date(),
      updatedAt: new Date(),
    });

    return new Response(JSON.stringify(newProject), {
      status: 201,
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (error) {
    console.error('❌ Error creating project:', error);
    return new Response(JSON.stringify({ error: 'Internal Server Error' }), {
      status: 500,
    });
  }
}
