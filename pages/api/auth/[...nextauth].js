import NextAuth from 'next-auth';
import Auth0Provider from 'next-auth/providers/auth0';

console.log('AUTH0_ISSUER:', process.env.AUTH0_ISSUER);

export default NextAuth({
  providers: [
    Auth0Provider({
      clientId: process.env.AUTH0_CLIENT_ID,
      clientSecret: process.env.AUTH0_CLIENT_SECRET,
      issuer: process.env.AUTH0_ISSUER, // Ensure this is correctly set
    }),
  ],
  secret: process.env.NEXTAUTH_SECRET,
  callbacks: {
    async session({ session, token }) {
      session.user.id = token.sub;
      return session;
    },
  },
});
