import { ObjectId } from 'mongodb';
import dbConnect from '@/lib/dbConnect';
import Project from '@/models/Project';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';

export async function GET(req, context) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), {
        status: 401,
      });
    }

    const id = context.params.id;
    if (!ObjectId.isValid(id)) {
      return new Response(JSON.stringify({ error: 'Invalid project ID' }), {
        status: 400,
      });
    }

    await dbConnect();
    const project = await Project.findOne({
      _id: id,
      userId: session.user.id,
    });

    if (!project) {
      return new Response(JSON.stringify({ error: 'Project not found' }), {
        status: 404,
      });
    }

    return new Response(JSON.stringify(project.documents || []), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (error) {
    console.error('Error fetching documents:', error);
    return new Response(JSON.stringify({ error: 'Internal Server Error' }), {
      status: 500,
    });
  }
}

export async function POST(req, context) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), {
        status: 401,
      });
    }

    const { id } = context.params;
    if (!ObjectId.isValid(id)) {
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

    // Create the new document object
    const newDocument = {
      _id: new ObjectId(),
      title,
      content: content || '',
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    // Update the project to include the new document
    const project = await Project.findOneAndUpdate(
      { _id: id, userId: session.user.id },
      { $push: { documents: newDocument } },
      { new: true }
    );

    if (!project) {
      return new Response(JSON.stringify({ error: 'Project not found' }), {
        status: 404,
      });
    }

    // Return only the new document
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

//Create a PUT request to update a document
export async function PUT(req, context) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), {
        status: 401,
      });
    }

    const { id, docId } = await context.params;
    const { title, content } = await req.json();

    if (!ObjectId.isValid(id) || !ObjectId.isValid(docId)) {
      return new Response(
        JSON.stringify({ error: 'Invalid project or document ID' }),
        { status: 400 }
      );
    }

    await dbConnect();
    const project = await Project.findOneAndUpdate(
      {
        _id: id,
        userId: session.user.id,
        'documents._id': docId,
      },
      {
        $set: {
          'documents.$.title': title,
          'documents.$.content': content,
          'documents.$.updatedAt': new Date(),
        },
      },
      { new: true }
    );

    if (!project) {
      return new Response(
        JSON.stringify({ error: 'Project or document not found' }),
        { status: 404 }
      );
    }

    return new Response(
      JSON.stringify({ message: 'Document updated successfully' }),
      {
        status: 200,
        headers: { 'Content-Type': 'application/json' },
      }
    );
  } catch (error) {
    console.error('Error updating document:', error);
    return new Response(JSON.stringify({ error: 'Internal Server Error' }), {
      status: 500,
    });
  }
}

export async function DELETE(req, context) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), {
        status: 401,
      });
    }

    const { id, docId } = await context.params;

    if (!ObjectId.isValid(id) || !ObjectId.isValid(docId)) {
      return new Response(
        JSON.stringify({ error: 'Invalid project or document ID' }),
        { status: 400 }
      );
    }

    await dbConnect();
    const project = await Project.findOneAndUpdate(
      { _id: id, userId: session.user.id },
      { $pull: { documents: { _id: docId } } },
      { new: true }
    );

    if (!project) {
      return new Response(
        JSON.stringify({ error: 'Project or document not found' }),
        { status: 404 }
      );
    }

    return new Response(
      JSON.stringify({ message: 'Document deleted successfully' }),
      {
        status: 200,
        headers: { 'Content-Type': 'application/json' },
      }
    );
  } catch (error) {
    console.error('Error deleting document:', error);
    return new Response(JSON.stringify({ error: 'Internal Server Error' }), {
      status: 500,
    });
  }
}
