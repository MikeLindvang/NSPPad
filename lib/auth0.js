import { initAuth0 } from '@auth0/nextjs-auth0';

console.log('baseURL:', process.env.NEXTAUTH_URL);
console.log('issuerBaseURL:', process.env.AUTH0_ISSUER);
console.log('clientID:', process.env.AUTH0_CLIENT_ID);
console.log('clientSecret:', process.env.AUTH0_CLIENT_SECRET);
console.log('secret:', process.env.NEXTAUTH_SECRET);

const auth0 = initAuth0({
  baseURL: process.env.NEXTAUTH_URL,
  issuerBaseURL: process.env.AUTH0_ISSUER,
  clientID: process.env.AUTH0_CLIENT_ID,
  clientSecret: process.env.AUTH0_CLIENT_SECRET,
  secret: process.env.NEXTAUTH_SECRET,
});

console.log('Auth0 Config:', auth0);

export default auth0;
