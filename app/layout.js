'use client';

import Link from 'next/link';
import { Geist, Geist_Mono } from 'next/font/google';
import { useSession, signOut } from 'next-auth/react';
import { SessionProvider } from 'next-auth/react';
import { usePathname } from 'next/navigation';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faSignOutAlt, faPenNib } from '@fortawesome/free-solid-svg-icons'; // 🖋️ Icon for NSPPad
import ThemeToggle from './components/ThemeToggle';
import md5 from 'md5';
import './globals.css';

// const geistSans = Geist({
//   variable: '--font-geist-sans',
//   subsets: ['latin'],
// });

// const geistMono = Geist_Mono({
//   variable: '--font-geist-mono',
//   subsets: ['latin'],
// });

export default function RootLayout({ children }) {
  const pathname = usePathname();
  const isProjectPage = pathname.startsWith('/projects/');

  return (
    <SessionProvider>
      <html lang="en">
        <body className={`antialiased  bg-gray-100 text-gray-900`}>
          {/* 🔹 Navbar (Fixed at Top) */}
          <nav className="w-full p-4 bg-white  dark:bg-background-dark dark:text-text-light shadow-md border-b border-gray-300">
            <div className=" mx-auto flex justify-between items-center">
              {/* 🔹 Updated NSPPad Logo */}
              <Link
                href="/"
                className="flex items-center gap-2 text-2xl font-extrabold text-gray-800 dark:text-text-dark"
              >
                <FontAwesomeIcon
                  icon={faPenNib}
                  className="text-blue-600 text-3xl"
                />
                NSPPad
              </Link>

              {/* 🔹 User Navigation (Aligned Right) */}
              <UserNavigation />
            </div>
          </nav>

          {/* 🔹 Conditional Full-Width Layout */}
          <main
            className={`${isProjectPage ? 'w-full' : 'max-w-6xl mx-auto p-5'}`}
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
    <div className="flex items-center space-x-5">
      <Link
        href="/dashboard"
        className="text-gray-600 hover:text-blue-500 dark:text-text-dark"
      >
        Dashboard
      </Link>
      {session ? (
        <div className="flex items-center space-x-3">
          {/* ✅ Clickable Avatar → Goes to Profile Page */}
          <Link href="/user/profile" title="Go to Profile">
            <img
              src={getGravatarUrl(session.user.email)}
              alt="User Avatar"
              className="w-9 h-9 rounded-full border border-gray-300 shadow-sm cursor-pointer hover:opacity-80 transition-opacity"
              loading="lazy"
            />
          </Link>

          <span className="text-gray-700 dark:text-text-dark font-medium">
            {session.user.name || getInitials(session.user.email)}
          </span>

          <button
            onClick={() => signOut({ callbackUrl: '/login' })}
            className="text-gray-600 dark:text-text-dark hover:text-blue-500 flex items-center"
          >
            Logout <FontAwesomeIcon icon={faSignOutAlt} className="ml-2" />
          </button>
        </div>
      ) : (
        <Link
          href="/login"
          className="text-gray-600 dark:text-text-dark hover:text-blue-500 dark:bg-gray-700 dark:text-text-dark"
        >
          Login
        </Link>
      )}
      <ThemeToggle />
    </div>
  );
}
