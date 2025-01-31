'use client';

import Link from 'next/link';
import { useSession } from 'next-auth/react';

export default function HomePage() {
  const { data: session } = useSession();

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-gray-100">
      <h1 className="text-4xl font-bold mb-4">Welcome to NSPPad</h1>
      <p className="text-lg text-gray-600 mb-6">
        Your AI-powered fiction writing assistant.
      </p>
      {session ? (
        <Link
          href="/dashboard"
          className="bg-blue-500 text-white px-6 py-3 rounded-lg shadow hover:bg-blue-700"
        >
          Go to Dashboard
        </Link>
      ) : (
        <Link
          href="/login"
          className="bg-blue-500 text-white px-6 py-3 rounded-lg shadow hover:bg-blue-700"
        >
          Get Started
        </Link>
      )}
    </div>
  );
}
