import mongoose from 'mongoose';
import dbConnect from '@/lib/dbConnect';
import Project from '@/models/Project';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';

export async function PUT(req, { params }) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), {
        status: 401,
      });
    }

    await dbConnect();

    const { id } = await params; // ✅ Project ID from URL
    const { documents } = await req.json(); // ✅ New document order (Full objects, not just IDs)

    // ✅ Validate Project ID
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return new Response(JSON.stringify({ error: 'Invalid project ID' }), {
        status: 400,
      });
    }

    // ✅ Fetch the current project to get existing document data
    const project = await Project.findOne({ _id: id, userId: session.user.id });

    if (!project) {
      return new Response(
        JSON.stringify({ error: 'Project not found or unauthorized' }),
        { status: 404 }
      );
    }

    // ✅ Reorder documents while keeping full document objects
    const reorderedDocuments = documents.map((docId) =>
      project.documents.find((doc) => doc._id.toString() === docId)
    );

    if (reorderedDocuments.includes(undefined)) {
      return new Response(
        JSON.stringify({ error: 'Invalid document ID in request' }),
        { status: 400 }
      );
    }

    // ✅ Update Project with new document order
    project.documents = reorderedDocuments;
    await project.save();

    return new Response(
      JSON.stringify({
        message: 'Document order updated successfully',
        project,
      }),
      {
        status: 200,
        headers: { 'Content-Type': 'application/json' },
      }
    );
  } catch (error) {
    console.error('❌ Error reordering documents:', error);
    return new Response(JSON.stringify({ error: 'Internal Server Error' }), {
      status: 500,
    });
  }
}
