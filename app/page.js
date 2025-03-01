'use client';

import Link from 'next/link';
import { useSession } from 'next-auth/react';

export default function HomePage() {
  const { data: session } = useSession();

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-gray-100 dark:bg-background-darkalt dark:text-text-dark">
      <h1 className="text-4xl font-bold mb-4">Welcome to NSPPad</h1>
      <p className="text-lg text-gray-600 dark:text-gray-400 mb-6">
        Your AI-powered fiction writing assistant.
      </p>
      {session ? (
        <Link href="/dashboard" className="btn btn-primary">
          Go to Dashboard
        </Link>
      ) : (
        <Link href="/login" className="btn btn-primary">
          Get Started
        </Link>
      )}
    </div>
  );
}
