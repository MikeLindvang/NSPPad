import { MongoClient } from 'mongodb';

const uri = process.env.MONGODB_URI;
const options = {};

let client;
let clientPromise;

if (!global._mongoClientPromise) {
  client = new MongoClient(uri, options);
  global._mongoClientPromise = client.connect();
}
clientPromise = global._mongoClientPromise;

export default async function getDatabase() {
  const client = await clientPromise;
  return client.db(process.env.MONGODB_DB); // Ensure correct usage here
}
