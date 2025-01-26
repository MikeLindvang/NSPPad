import getDatabase from '@/lib/mongodb';

export async function PATCH(req, { params }) {
  const { documents } = await req.json();
  const db = await getDatabase();

  await db
    .collection('projects')
    .updateOne(
      { _id: params.id },
      { $set: { documents, updatedAt: new Date() } }
    );

  return new Response(JSON.stringify({ message: 'Document order updated' }), {
    status: 200,
  });
}
