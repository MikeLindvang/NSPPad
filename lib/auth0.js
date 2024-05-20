import { initAuth0 } from '@auth0/nextjs-auth0';

const auth0 = initAuth0({
  baseURL: process.env.NEXTAUTH_URL,
  issuerBaseURL: process.env.AUTH0_ISSUER,
  clientID: process.env.AUTH0_CLIENT_ID,
  clientSecret: process.env.AUTH0_CLIENT_SECRET,
  secret: process.env.NEXTAUTH_SECRET,
});

export default auth0;
