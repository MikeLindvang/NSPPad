import NextAuth from 'next-auth';
import CredentialsProvider from 'next-auth/providers/credentials';
import { MongoDBAdapter } from '@next-auth/mongodb-adapter';
import { clientPromise } from '@/lib/mongodb';
import bcrypt from 'bcryptjs';

export const authOptions = {
  adapter: MongoDBAdapter(clientPromise), // Pass the client promise correctly
  providers: [
    CredentialsProvider({
      name: 'Credentials',
      credentials: {
        email: { label: 'Email', type: 'email' },
        password: { label: 'Password', type: 'password' },
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) {
          throw new Error('Missing email or password');
        }

        const db = await (await clientPromise).db(process.env.MONGODB_DB);
        const usersCollection = db.collection('users');

        // Find user by email
        const user = await usersCollection.findOne({
          email: credentials.email,
        });

        if (!user) {
          throw new Error('User not found');
        }

        // Compare hashed password
        const isValid = await bcrypt.compare(
          credentials.password,
          user.password
        );
        if (!isValid) {
          throw new Error('Invalid credentials');
        }

        return { id: user._id.toString(), email: user.email, name: user.name };
      },
    }),
  ],
  pages: {
    signIn: '/login',
  },
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.id = user.id;
      }
      return token;
    },
    async session({ session, token }) {
      if (token?.id) {
        session.user.id = token.id;
      }
      return session;
    },
  },
  secret: process.env.NEXTAUTH_SECRET,
  session: {
    strategy: 'jwt',
  },
  debug: process.env.NODE_ENV === 'development', // Enable debugging in development mode
};

const handler = NextAuth(authOptions);

export { handler as GET, handler as POST };
