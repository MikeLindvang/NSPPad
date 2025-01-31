import { getServerSession } from 'next-auth';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';
import getDatabase from '@/lib/mongodb';

export async function GET(req) {
  const session = await getServerSession(authOptions);

  if (!session) {
    return new Response(JSON.stringify({ error: 'Unauthorized' }), {
      status: 401,
    });
  }

  const db = await getDatabase();
  const user = await db
    .collection('users')
    .findOne({ email: session.user.email });

  if (!user) {
    return new Response(JSON.stringify({ error: 'User not found' }), {
      status: 404,
    });
  }

  return new Response(JSON.stringify({ name: user.name, email: user.email }), {
    status: 200,
  });
}
