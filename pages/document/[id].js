import { ObjectId } from 'mongodb';
import clientPromise from '../../lib/mongodb';
import { useUser } from '@auth0/nextjs-auth0/client';
import { useRouter } from 'next/router';
import { useEffect } from 'react';
import Editor from '../../components/Editor';

export async function getServerSideProps({ params }) {
  const client = await clientPromise;
  const db = client.db();
  const document = await db
    .collection('documents')
    .findOne({ _id: new ObjectId(params.id) });

  return {
    props: { document: JSON.parse(JSON.stringify(document)) },
  };
}

export default function DocumentPage({ document }) {
  const { user } = useUser();
  const router = useRouter();

  useEffect(() => {
    if (!user) {
      router.push('/');
    }
  }, [user, router]);

  const saveDocument = async ({ title, content }) => {
    await fetch(`/api/document/${document._id}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ title, content }),
    });
  };

  return (
    <div className="container mx-auto p-4">
      <div className="flex justify-between items-center mb-4">
        <button onClick={() => router.push('/')} className="btn">
          Home
        </button>
        <button
          onClick={async () => {
            await fetch(`/api/document/${document._id}`, { method: 'DELETE' });
            router.push('/');
          }}
          className="btn"
        >
          Delete
        </button>
      </div>
      <Editor document={document} onSave={saveDocument} />
    </div>
  );
}
