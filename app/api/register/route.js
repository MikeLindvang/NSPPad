import getDatabase from '@/lib/mongodb';
import bcrypt from 'bcryptjs';

export async function POST(req) {
  try {
    const { email, password, name } = await req.json();
    const db = await getDatabase();
    const usersCollection = db.collection('users');

    // Check if user already exists
    const existingUser = await usersCollection.findOne({ email });
    if (existingUser) {
      return new Response(JSON.stringify({ message: 'User already exists' }), {
        status: 400,
      });
    }

    // Hash the password before storing
    const hashedPassword = await bcrypt.hash(password, 10);

    await usersCollection.insertOne({
      email,
      password: hashedPassword, // Ensure we store the hashed password
      name,
      createdAt: new Date(),
    });

    return new Response(
      JSON.stringify({ message: 'User registered successfully' }),
      { status: 201 }
    );
  } catch (error) {
    console.error('Error registering user:', error);
    return new Response(JSON.stringify({ message: 'Error registering user' }), {
      status: 500,
    });
  }
}
