'use client';

import { useUser } from '@auth0/nextjs-auth0/client';
import { useRouter } from 'next/router';
import clientPromise from '../lib/mongodb';
import { useEffect } from 'react';
import { format } from 'date-fns';

export async function getServerSideProps() {
  const client = await clientPromise;
  const db = client.db();
  const documents = await db
    .collection('documents')
    .find({})
    .sort({ updatedAt: -1 })
    .toArray();
  return {
    props: { documents: JSON.parse(JSON.stringify(documents)) },
  };
}

export default function Home({ documents }) {
  const { user, error, isLoading } = useUser();
  const router = useRouter();

  if (isLoading) return <div>Loading...</div>;
  if (error) return <div>{error.message}</div>;

  return (
    <div className="container mx-auto p-4">
      <div className="flex justify-between items-center mb-4">
        <h1 className="text-3xl font-bold">NSPPad</h1>
        <div>
          {user ? (
            <div>
              <span>Welcome, {user.name}</span>
              <button
                onClick={() => router.push('/api/auth/logout')}
                className="btn ml-4"
              >
                Sign out
              </button>
            </div>
          ) : (
            <button
              onClick={() => router.push('/api/auth/login')}
              className="btn"
            >
              Sign in
            </button>
          )}
        </div>
      </div>
      {user && (
        <div>
          <div className="mb-4">
            <button onClick={() => router.push('/new')} className="btn">
              Create New Document
            </button>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
            {documents.map((doc) => (
              <div key={doc._id} className="p-4 border rounded shadow">
                <h2 className="text-xl font-bold">{doc.title}</h2>
                <p>
                  {JSON.parse(doc.content)
                    .map((block) => block.children[0].text)
                    .join(' ')
                    .slice(0, 100)}
                  ...
                </p>
                <p>
                  {doc.updatedAt
                    ? format(new Date(doc.updatedAt), 'dd MMM, hh:mm a')
                    : 'No Date'}
                </p>
                <button
                  onClick={() => router.push(`/document/${doc._id}`)}
                  className="btn mt-2"
                >
                  Edit
                </button>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
