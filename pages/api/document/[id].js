import { ObjectId } from 'mongodb';
import clientPromise from '../../../lib/mongodb';

export default async function handler(req, res) {
  const client = await clientPromise;
  const db = client.db();
  const { id } = req.query;

  if (req.method === 'PUT') {
    const { content, title } = req.body;
    await db
      .collection('documents')
      .updateOne(
        { _id: new ObjectId(id) },
        { $set: { content, title, updatedAt: new Date() } }
      );
    res.json({ message: 'Document updated' });
  } else if (req.method === 'DELETE') {
    await db.collection('documents').deleteOne({ _id: new ObjectId(id) });
    res.json({ message: 'Document deleted' });
  }
}
