'use client';
import Link from 'next/link';
import { useSession, signOut } from 'next-auth/react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faSignOutAlt } from '@fortawesome/free-solid-svg-icons';
import md5 from 'md5';

export default function Home() {
  const { data: session } = useSession();

  const getGravatarUrl = (email) => {
    const hash = md5(email.trim().toLowerCase());
    return `https://www.gravatar.com/avatar/${hash}?d=identicon`;
  };

  return (
    <div className="min-h-screen bg-gray-100 flex flex-col items-center justify-center text-center p-5">
      <h1 className="text-5xl font-bold mb-6 text-gray-800">
        Welcome to NSPPad
      </h1>
      <p className="text-lg text-gray-600 max-w-2xl mb-8">
        Elevate your fiction writing with AI-powered depth analysis.
      </p>
      <div className="space-x-4 flex items-center">
        <Link href="/dashboard">
          <button className="bg-blue-500 text-white px-6 py-3 rounded-md hover:bg-blue-700 transition">
            Project Dashboard
          </button>
        </Link>
        {session ? (
          <div className="flex items-center space-x-3">
            <button
              onClick={() => signOut()}
              className="border border-blue-500 text-blue-500 px-6 py-3 rounded-md hover:bg-blue-500 hover:text-white transition flex items-center"
            >
              Logout <FontAwesomeIcon icon={faSignOutAlt} className="ml-2" />
            </button>
          </div>
        ) : (
          <Link href="/login">
            <button className="border border-blue-500 text-blue-500 px-6 py-3 rounded-md hover:bg-blue-500 hover:text-white transition">
              Login / Sign Up
            </button>
          </Link>
        )}
      </div>
    </div>
  );
}
