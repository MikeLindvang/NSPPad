'use client';

import { useState } from 'react';
import BookStyleManager from '../../components/BookStyleManager';
import AuthorStyleManager from '../../components/AuthorStyleManager'; // New Component

export default function UserProfile() {
  const [activeTab, setActiveTab] = useState('bookStyles');

  return (
    <div className="max-w-3xl mx-auto p-6">
      <h1 className="text-2xl font-bold mb-4">User Profile</h1>

      {/* Navigation Tabs */}
      <div className="flex border-b">
        <button
          onClick={() => setActiveTab('bookStyles')}
          className={`px-4 py-2 text-lg ${
            activeTab === 'bookStyles'
              ? 'border-b-2 border-blue-500 font-bold'
              : 'text-gray-500'
          }`}
        >
          Book Styles
        </button>
        <button
          onClick={() => setActiveTab('authorStyles')}
          className={`px-4 py-2 text-lg ${
            activeTab === 'authorStyles'
              ? 'border-b-2 border-blue-500 font-bold'
              : 'text-gray-500'
          }`}
        >
          Author Styles
        </button>
      </div>

      {/* Content Sections */}
      <div className="mt-4">
        {activeTab === 'bookStyles' && <BookStyleManager />}
        {activeTab === 'authorStyles' && <AuthorStyleManager />}
      </div>
    </div>
  );
}
