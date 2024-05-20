import clientPromise from '../../../lib/mongodb';

export default async function handler(req, res) {
  if (req.method === 'POST') {
    const client = await clientPromise;
    const db = client.db();
    const { title, content } = req.body;

    const result = await db.collection('documents').insertOne({
      title,
      content,
      createdAt: new Date(),
      updatedAt: new Date(),
    });

    res.json({
      _id: result.insertedId,
      title,
      content,
      createdAt: new Date(),
      updatedAt: new Date(),
    });
  } else {
    res.status(405).end(); // Method Not Allowed
  }
}
