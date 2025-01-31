import { ObjectId } from 'mongodb';
import dbConnect from '@/lib/dbConnect';
import Project from '@/models/Project';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';

export async function GET(req, { params }) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), {
        status: 401,
      });
    }

    const { id: projectId } = await params;

    if (!ObjectId.isValid(projectId)) {
      return new Response(JSON.stringify({ error: 'Invalid project ID' }), {
        status: 400,
      });
    }

    await dbConnect();

    const project = await Project.findOne({
      _id: projectId,
      userId: session.user.id,
    }).lean();

    if (!project) {
      return new Response(JSON.stringify({ error: 'Project not found' }), {
        status: 404,
      });
    }

    return new Response(JSON.stringify(project), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (error) {
    console.error('Error fetching project:', error);
    return new Response(JSON.stringify({ error: 'Internal Server Error' }), {
      status: 500,
    });
  }
}

export async function PUT(req, { params }) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), {
        status: 401,
      });
    }

    const { id: projectId } = await params;

    if (!ObjectId.isValid(projectId)) {
      return new Response(JSON.stringify({ error: 'Invalid project ID' }), {
        status: 400,
      });
    }

    const body = await req.json();

    await dbConnect();

    // Remove immutable _id field if it exists in the request
    if (body._id) {
      delete body._id;
    }

    const updatedProject = await Project.findOneAndUpdate(
      { _id: projectId, userId: session.user.id },
      { ...body, updatedAt: new Date() },
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
        message: 'Project updated successfully',
        project: updatedProject,
      }),
      {
        status: 200,
        headers: { 'Content-Type': 'application/json' },
      }
    );
  } catch (error) {
    console.error('Error updating project:', error);
    return new Response(JSON.stringify({ error: 'Internal Server Error' }), {
      status: 500,
    });
  }
}

export async function DELETE(req, { params }) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), {
        status: 401,
      });
    }

    const { id: projectId } = await params;

    if (!ObjectId.isValid(projectId)) {
      return new Response(JSON.stringify({ error: 'Invalid project ID' }), {
        status: 400,
      });
    }

    await dbConnect();

    const result = await Project.deleteOne({
      _id: projectId,
      userId: session.user.id,
    });

    if (result.deletedCount === 0) {
      return new Response(
        JSON.stringify({ error: 'Project not found or unauthorized' }),
        { status: 404 }
      );
    }

    return new Response(
      JSON.stringify({
        message: 'Project deleted successfully',
        deletedId: projectId,
      }),
      {
        status: 200,
        headers: { 'Content-Type': 'application/json' },
      }
    );
  } catch (error) {
    console.error('Error deleting project:', error);
    return new Response(JSON.stringify({ error: 'Internal Server Error' }), {
      status: 500,
    });
  }
}
