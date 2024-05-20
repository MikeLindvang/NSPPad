'use client';

import { useUser } from '@auth0/nextjs-auth0/client';
import { useRouter } from 'next/router';
import { useEffect, useState } from 'react';
import Editor from '../components/Editor';

export default function NewDocument() {
  const { user } = useUser();
  const router = useRouter();
  const [document, setDocument] = useState({
    title: '',
    content: JSON.stringify([{ type: 'paragraph', children: [{ text: '' }] }]),
  });

  useEffect(() => {
    if (!user) {
      router.push('/');
    }
  }, [user, router]);

  const saveDocument = async ({ title, content }) => {
    const res = await fetch('/api/document', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ title, content }),
    });
    const newDoc = await res.json();
    router.push(`/document/${newDoc._id}`);
  };

  return (
    <div className="container mx-auto p-4">
      <Editor document={document} onSave={saveDocument} />
    </div>
  );
}
