import NextAuth from 'next-auth';
import CredentialsProvider from 'next-auth/providers/credentials';
import { MongoDBAdapter } from '@next-auth/mongodb-adapter';
import { clientPromise } from '@/lib/mongodb';
import bcrypt from 'bcryptjs';

export const authOptions = {
  adapter: MongoDBAdapter(clientPromise), // Ensure proper MongoDB adapter
  providers: [
    CredentialsProvider({
      name: 'Credentials',
      credentials: {
        email: {
          label: 'Email',
          type: 'email',
          placeholder: 'your@example.com',
        },
        password: { label: 'Password', type: 'password' },
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) {
          throw new Error('Missing email or password');
        }

        try {
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

          return {
            id: user._id.toString(),
            email: user.email,
            name: user.name,
          };
        } catch (error) {
          console.error('Error authorizing user:', error);
          throw new Error('Internal Server Error');
        }
      },
    }),
  ],
  pages: {
    signIn: '/login', // Custom login page
    error: '/auth/error', // Redirect for auth errors
  },
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.id = user.id;
        token.email = user.email;
        token.name = user.name;
      }
      return token;
    },
    async session({ session, token }) {
      if (token?.id) {
        session.user.id = token.id;
        session.user.email = token.email;
        session.user.name = token.name;
      }
      return session;
    },
  },
  secret: process.env.NEXTAUTH_SECRET,
  session: {
    strategy: 'jwt', // Using JWT to avoid database sessions
    maxAge: 30 * 24 * 60 * 60, // 30 days session expiration
  },
  cookies: {
    sessionToken: {
      name: `next-auth.session-token`,
      options: {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'lax',
        path: '/',
      },
    },
  },
  debug: process.env.NODE_ENV === 'development', // Enable debug logging only in development mode
};

const handler = NextAuth(authOptions);

export { handler as GET, handler as POST };
