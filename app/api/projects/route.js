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

    // 🔥 Ensure userId is a string for matching
    const userIdString = String(session.user.id);

    // 🔍 Fetch projects with populated styles
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

    const {
      title = 'Untitled Project',
      bookStyleId = null,
      authorStyleId = null,
      projectType = 'fiction', // <-- new field, defaulting to 'fiction'
    } = await req.json();

    // ✅ Validate projectType just in case
    const validTypes = ['fiction', 'nonfiction'];
    const safeProjectType = validTypes.includes(projectType)
      ? projectType
      : 'fiction';

    await dbConnect();

    const defaultDocument = {
      _id: new ObjectId(),
      title: 'Untitled Document',
      content: 'Write your content here...',
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
    };

    const newProject = await Project.create({
      title,
      userId: new ObjectId(session.user.id),
      bookStyleId: bookStyleId ? new ObjectId(bookStyleId) : null,
      authorStyleId: authorStyleId ? new ObjectId(authorStyleId) : null,
      projectType: safeProjectType, // <-- added here
      documents: [defaultDocument],
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
