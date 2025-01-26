import getDatabase from '@/lib/mongodb';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';

// Handle GET request to fetch all projects
export async function GET() {
  try {
    const db = await getDatabase();
    const projects = await db.collection('projects').find({}).toArray();

    return new Response(JSON.stringify(projects), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (error) {
    console.error('Error fetching projects:', error);
    return new Response(JSON.stringify({ error: 'Internal Server Error' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }
}

// Handle POST request to create a new project
export async function POST(req) {
  try {
    const { title } = await req.json();

    if (!title || title.trim() === '') {
      return new Response(JSON.stringify({ error: 'Title is required' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    const db = await getDatabase();
    const newProject = {
      title: title.trim(),
      createdAt: new Date(),
      updatedAt: new Date(),
      documents: [],
    };

    const result = await db.collection('projects').insertOne(newProject);

    return new Response(
      JSON.stringify({ _id: result.insertedId, ...newProject }),
      {
        status: 201,
        headers: { 'Content-Type': 'application/json' },
      }
    );
  } catch (error) {
    console.error('Error creating project:', error);
    return new Response(JSON.stringify({ error: 'Internal Server Error' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }
}
