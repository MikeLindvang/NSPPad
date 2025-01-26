'use client';

import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import { EditorContent, useEditor } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import AnalysisSidebar from '../components/AnalysisSidebar';
import DepthScore from '../components/DepthScore';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import {
  faBars,
  faChevronDown,
  faChevronUp,
} from '@fortawesome/free-solid-svg-icons';

export default function Pad() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [showSidebar, setShowSidebar] = useState(true);
  const [showDetailedScores, setShowDetailedScores] = useState(false);
  const [wordCount, setWordCount] = useState(0);

  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/login');
    }
  }, [status, router]);

  const editor = useEditor({
    extensions: [StarterKit],
    content: 'Start writing your masterpiece here...',
    onUpdate: ({ editor }) => {
      setWordCount(editor.getText().trim().split(/\s+/).length);
    },
  });

  if (status === 'loading') {
    return <p className="text-center text-gray-600">Loading...</p>;
  }

  return (
    <div className="min-h-screen bg-gray-100 flex">
      {showSidebar && <AnalysisSidebar />}

      <div className="flex-1 flex flex-col items-center py-10 px-8">
        <h1 className="text-3xl font-bold mb-5 text-center">
          Welcome, {session?.user?.name || session?.user?.email}
        </h1>
        <div className="w-full max-w-4xl bg-white shadow-lg rounded-lg p-8">
          <EditorContent
            editor={editor}
            className="border border-gray-300 rounded-md p-5 min-h-[500px] w-full"
          />
          <div className="flex justify-between mt-3 text-gray-600">
            <span>Word Count: {wordCount}</span>
            <button
              onClick={() => setShowSidebar(!showSidebar)}
              className="bg-white text-gray-500 p-2 rounded-full hover:bg-gray-200"
            >
              <FontAwesomeIcon icon={faBars} />
            </button>
          </div>
          <div className="mt-5 p-4 border-t border-gray-300">
            <h2 className="text-lg font-bold mb-3">Depth Score</h2>
            <div className="flex items-center justify-between">
              <div className="w-full bg-gray-200 rounded h-3 relative">
                <div
                  className="h-3 bg-green-500 rounded"
                  style={{ width: '75%' }}
                ></div>
              </div>
              <button
                onClick={() => setShowDetailedScores(!showDetailedScores)}
                className="ml-4 bg-white text-gray-500 p-2 rounded-full hover:bg-gray-200"
              >
                <FontAwesomeIcon
                  icon={showDetailedScores ? faChevronUp : faChevronDown}
                />
              </button>
            </div>
            {showDetailedScores && <DepthScore />}
          </div>
        </div>
      </div>
    </div>
  );
}
