'use client';

import Link from 'next/link';
import { Geist, Geist_Mono } from 'next/font/google';
import { useSession, signOut } from 'next-auth/react';
import { SessionProvider } from 'next-auth/react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faSignOutAlt } from '@fortawesome/free-solid-svg-icons';
import md5 from 'md5';
import './globals.css';

const geistSans = Geist({
  variable: '--font-geist-sans',
  subsets: ['latin'],
});

const geistMono = Geist_Mono({
  variable: '--font-geist-mono',
  subsets: ['latin'],
});

export default function RootLayout({ children }) {
  return (
    <SessionProvider>
      <html lang="en">
        <body
          className={`${geistSans.variable} ${geistMono.variable} antialiased bg-gray-100 text-gray-900`}
        >
          <nav className="w-full p-5 bg-white shadow-md">
            <div className="max-w-5xl mx-auto flex justify-between items-center">
              <Link href="/" className="text-xl font-bold text-gray-800">
                NSPPad
              </Link>
              <UserNavigation />
            </div>
          </nav>
          {children}
        </body>
      </html>
    </SessionProvider>
  );
}

function UserNavigation() {
  const { data: session } = useSession();

  const getGravatarUrl = (email) => {
    const hash = md5(email.trim().toLowerCase());
    return `https://www.gravatar.com/avatar/${hash}?d=identicon`;
  };

  const getInitials = (name) => {
    return name
      ? name
          .split(' ')
          .map((n) => n[0].toUpperCase())
          .join('')
      : '?';
  };

  return (
    <div className="space-x-4 flex items-center">
      <Link href="/dashboard" className="text-gray-600 hover:text-blue-500">
        Dashboard
      </Link>
      {session ? (
        <div className="flex items-center space-x-3">
          <img
            src={getGravatarUrl(session.user.email)}
            alt="User Avatar"
            className="w-8 h-8 rounded-full border border-gray-300"
          />
          <span className="text-gray-600 font-medium">
            {session.user.name || getInitials(session.user.email)}
          </span>
          <button
            onClick={() => signOut()}
            className="text-gray-600 hover:text-blue-500 flex items-center"
          >
            Logout <FontAwesomeIcon icon={faSignOutAlt} className="ml-2" />
          </button>
        </div>
      ) : (
        <Link href="/login" className="text-gray-600 hover:text-blue-500">
          Login
        </Link>
      )}
    </div>
  );
}
