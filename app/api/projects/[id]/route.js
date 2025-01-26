import { ObjectId } from 'mongodb';
import getDatabase from '@/lib/mongodb';

// Handle GET request to fetch a single project by ID
export async function GET(req, context) {
  try {
    const { id } = context.params;

    if (!ObjectId.isValid(id)) {
      return new Response(JSON.stringify({ error: 'Invalid project ID' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    const db = await getDatabase();
    const project = await db
      .collection('projects')
      .findOne({ _id: new ObjectId(id) });

    if (!project) {
      return new Response(JSON.stringify({ error: 'Project not found' }), {
        status: 404,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    return new Response(JSON.stringify(project), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (error) {
    console.error('Error fetching project:', error);
    return new Response(
      JSON.stringify({ error: error.message || 'Internal Server Error' }),
      {
        status: 500,
        headers: { 'Content-Type': 'application/json' },
      }
    );
  }
}

// Handle PUT request to update project title and documents
export async function PUT(req, context) {
  try {
    const { id } = context.params;
    const body = await req.json();

    if (!ObjectId.isValid(id)) {
      return new Response(JSON.stringify({ error: 'Invalid project ID' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    if (!body?.title || !Array.isArray(body?.documents)) {
      return new Response(
        JSON.stringify({ error: 'Missing or invalid data' }),
        {
          status: 400,
          headers: { 'Content-Type': 'application/json' },
        }
      );
    }

    const { title, documents } = body;
    const db = await getDatabase();

    const result = await db
      .collection('projects')
      .updateOne(
        { _id: new ObjectId(id) },
        { $set: { title, documents, updatedAt: new Date() } }
      );

    if (result.matchedCount === 0) {
      return new Response(JSON.stringify({ error: 'Project not found' }), {
        status: 404,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    const updatedProject = await db
      .collection('projects')
      .findOne({ _id: new ObjectId(id) });

    return new Response(JSON.stringify(updatedProject), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (error) {
    console.error('Error updating project:', error);
    return new Response(
      JSON.stringify({ error: error.message || 'Internal Server Error' }),
      {
        status: 500,
        headers: { 'Content-Type': 'application/json' },
      }
    );
  }
}

// Handle DELETE request to remove a project by ID
export async function DELETE(req, context) {
  try {
    const { id } = context.params;

    if (!ObjectId.isValid(id)) {
      return new Response(JSON.stringify({ error: 'Invalid project ID' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    const db = await getDatabase();
    const result = await db
      .collection('projects')
      .deleteOne({ _id: new ObjectId(id) });

    if (result.deletedCount === 0) {
      return new Response(JSON.stringify({ error: 'Project not found' }), {
        status: 404,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    return new Response(
      JSON.stringify({
        message: 'Project deleted successfully',
        deletedId: id,
      }),
      {
        status: 200,
        headers: { 'Content-Type': 'application/json' },
      }
    );
  } catch (error) {
    console.error('Error deleting project:', error);
    return new Response(
      JSON.stringify({ error: error.message || 'Internal Server Error' }),
      {
        status: 500,
        headers: { 'Content-Type': 'application/json' },
      }
    );
  }
}
