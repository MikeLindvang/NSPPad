'use client';

import Link from 'next/link';
import { Geist, Geist_Mono } from 'next/font/google';
import { useSession, signOut } from 'next-auth/react';
import { SessionProvider } from 'next-auth/react';
import { usePathname } from 'next/navigation'; // ✅ Import usePathname
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
  const pathname = usePathname(); // ✅ Get current route

  // ✅ If on a project page, remove the width restriction
  const isProjectPage = pathname.startsWith('/projects/');

  return (
    <SessionProvider>
      <html lang="en">
        <body
          className={`${geistSans.variable} ${geistMono.variable} antialiased bg-gray-100 text-gray-900`}
        >
          {/* 🔹 Navbar (Always Fixed at Top) */}
          <nav className="w-full p-5 bg-white shadow-md">
            <div className="max-w-5xl mx-auto flex justify-between items-center">
              <Link href="/" className="text-xl font-bold text-gray-800">
                NSPPad
              </Link>
              <UserNavigation />
            </div>
          </nav>

          {/* 🔹 Conditional Full-Width Layout */}
          <main
            className={`${isProjectPage ? 'w-full' : 'max-w-5xl mx-auto p-5'}`}
          >
            {children}
          </main>
        </body>
      </html>
    </SessionProvider>
  );
}

function UserNavigation() {
  const { data: session, status } = useSession();

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

  if (status === 'loading') {
    return <p className="text-gray-500">Loading...</p>;
  }

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
            loading="lazy"
          />
          <span className="text-gray-600 font-medium">
            {session.user.name || getInitials(session.user.email)}
          </span>
          <button
            onClick={() => signOut({ callbackUrl: '/login' })}
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
