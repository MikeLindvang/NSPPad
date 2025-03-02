'use client';

import { useState, useEffect } from 'react';
import { MdOutlineAutorenew } from 'react-icons/md'; // Spinner icon
import { FaSyncAlt } from 'react-icons/fa'; // Analyze Icon
import DepthScore from '../components/DepthScore';
import { useFeedback } from '../context/FeedbackContext'; // ✅ Feedback Context
import { useDocument } from '../context/DocumentContext'; // ✅ Document Context
import { useEditor } from '../context/EditorContext'; // ✅ Editor Context
import { useProject } from '../context/ProjectContext'; // ✅ Project Context
import Tooltip from '../components/Tooltip';

export default function AnalysisSidebar() {
  const { inlineFeedback, setInlineFeedback, highlights, addHighlight } =
    useFeedback();
  const { selectedDoc, setSelectedDoc, updateDocument } = useDocument(); // ✅ Fix: Import setSelectedDoc & updateDocument
  const { selectTextInEditor } = useEditor();
  const { project } = useProject();

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  // Function to analyze text
  const analyze = async () => {
    if (!selectedDoc?.content) {
      setError('Document is empty. Add content to analyze.');
      return;
    }

    setLoading(true);
    setError('');

    try {
      console.log(
        '🔍 Sending analysis request...',
        selectedDoc?._id,
        selectedDoc?.content?.slice(0, 50)
      );

      const response = await fetch('/api/analyze', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          projectId: project._id, // Ensure this is correct
          docId: selectedDoc._id,
          text: selectedDoc.content,
        }),
      });

      console.log('🔍 API response received:', response);

      const result = await response.json();

      if (!response.ok)
        throw new Error(result.error || 'Failed to analyze text');

      console.log('✅ Analysis Result:', result);

      // ✅ Fix: Set the updated analysis data in the selected document
      setSelectedDoc((prev) => ({
        ...prev,
        analysisData: result.analysisData,
        analysisScore: result.analysisScore,
        highlights: result.highlights || {},
      }));

      // ✅ Fix: Update the document in the database
      await updateDocument(selectedDoc._id, {
        analysisData: result.analysisData,
        analysisScore: result.analysisScore,
        highlights: result.highlights || {},
      });

      console.log('💾 Analysis data saved!');
    } catch (err) {
      console.error('❌ Error analyzing text:', err);
      setError('Failed to analyze text. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  // ✅ Listen for Ctrl + Alt + A
  useEffect(() => {
    const handleKeyDown = (event) => {
      if (event.ctrlKey && event.altKey && event.key.toLowerCase() === 'a') {
        event.preventDefault();
        console.log('🔍 Analysis triggered via shortcut!');
        analyze();
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => {
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [analyze]);

  return (
    <aside className="w-96 bg-background-light dark:bg-background-dark dark:text-text-dark shadow-lg p-6 border-l border-gray-300 h-full overflow-y-auto">
      <div className="flex justify-end mb-2">
        <button
          onClick={analyze}
          className="text-gray-600 hover:text-black"
          disabled={loading}
        >
          {loading ? (
            <MdOutlineAutorenew className="animate-spin text-xl" />
          ) : (
            <FaSyncAlt className="text-xl" title="Analyze" />
          )}
        </button>
      </div>

      <DepthScore analysisData={selectedDoc?.analysisData} />

      <h2 className="text-xl font-bold mb-4">Depth Analysis Feedback</h2>

      <div>
        {selectedDoc?.highlights &&
        Object.keys(selectedDoc.highlights).length > 0 ? (
          <ul className="space-y-2">
            {Object.entries(selectedDoc.highlights).map(
              ([id, { text, suggestions }]) => (
                <li
                  key={id}
                  className="p-2 bg-gray-100 rounded cursor-pointer hover:bg-blue-300"
                  onClick={() => {
                    console.log(`Selecting text: ${text}`);
                    selectTextInEditor(text);
                  }}
                >
                  <strong>{text}</strong>
                  <p className="text-gray-700 text-sm">
                    {suggestions[0].advice}
                  </p>
                </li>
              )
            )}
          </ul>
        ) : (
          <p className="text-gray-500 text-sm">No inline feedback found.</p>
        )}
      </div>
    </aside>
  );
}
