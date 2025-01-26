import { ObjectId } from 'mongodb';
import getDatabase from '@/lib/mongodb';

// Handle DELETE request to remove a specific document from a project
export async function DELETE(req, context) {
  try {
    const { id, docId } = context.params;

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

    // Filter out the document to be deleted
    const updatedDocuments = project.documents.filter(
      (doc) => doc.id.toString() !== docId
    );

    const updateResult = await db
      .collection('projects')
      .updateOne(
        { _id: new ObjectId(id) },
        { $set: { documents: updatedDocuments, updatedAt: new Date() } }
      );

    if (updateResult.modifiedCount === 0) {
      return new Response(JSON.stringify({ error: 'Document not deleted' }), {
        status: 500,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    return new Response(
      JSON.stringify({
        message: 'Document deleted successfully',
        documents: updatedDocuments,
      }),
      { status: 200, headers: { 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    console.error('Error deleting document:', error);
    return new Response(
      JSON.stringify({ error: error.message || 'Internal Server Error' }),
      {
        status: 500,
        headers: { 'Content-Type': 'application/json' },
      }
    );
  }
}

// Handle PUT request to update a specific document within a project
export async function PUT(req, context) {
  try {
    const { id, docId } = context.params;
    const body = await req.json();

    if (!ObjectId.isValid(id)) {
      return new Response(JSON.stringify({ error: 'Invalid project ID' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    if (!body?.title || !body?.content) {
      return new Response(
        JSON.stringify({ error: 'Missing title or content' }),
        {
          status: 400,
          headers: { 'Content-Type': 'application/json' },
        }
      );
    }

    const { title, content } = body;

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

    const updatedDocuments = project.documents.map((doc) =>
      doc.id.toString() === docId ? { ...doc, title, content } : doc
    );

    const updateResult = await db
      .collection('projects')
      .updateOne(
        { _id: new ObjectId(id) },
        { $set: { documents: updatedDocuments, updatedAt: new Date() } }
      );

    if (updateResult.modifiedCount === 0) {
      return new Response(JSON.stringify({ error: 'Document not updated' }), {
        status: 500,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    return new Response(JSON.stringify(updatedDocuments), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (error) {
    console.error('Error updating document:', error);
    return new Response(
      JSON.stringify({ error: error.message || 'Internal Server Error' }),
      {
        status: 500,
        headers: { 'Content-Type': 'application/json' },
      }
    );
  }
}
