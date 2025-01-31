'use client';

import { useState } from 'react';
import { MdOutlineAutorenew } from 'react-icons/md'; // Spinner icon
import { FaSyncAlt } from 'react-icons/fa'; // Analyze Icon
import DepthScore from './DepthScore';
import { useProject } from '../context/ProjectContext';

export default function AnalysisSidebar() {
  const {
    project,
    selectedDoc,
    analyzeText,
    selectTextInEditor, // 🔹 Ensure this function is still accessible
  } = useProject();

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [viewMode, setViewMode] = useState('general'); // "general" or "inline"

  const projectId = project?._id;

  // Function to analyze text
  const analyze = async () => {
    if (!selectedDoc?.content) {
      setError('Document is empty. Add content to analyze.');
      return;
    }

    setLoading(true);
    setError('');

    try {
      const response = await fetch('/api/analyze', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          projectId,
          docId: selectedDoc._id,
          text: selectedDoc.content,
        }),
      });

      const result = await response.json();

      if (!response.ok)
        throw new Error(result.error || 'Failed to analyze text');

      // Ensure the highlights are properly stored in selectedDoc
      selectedDoc.analysisData = {
        sensoryDetails: result.analysisData.sensoryDetails,
        povDepth: result.analysisData.povDepth,
        emotionalResonance: result.analysisData.emotionalResonance,
        conflict: result.analysisData.conflict,
      };

      selectedDoc.analysisScore = result.analysisScore;
      selectedDoc.highlights = result.highlights || {};
    } catch (err) {
      setError('Failed to analyze text. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <aside className="w-96 bg-slate-200 shadow-lg p-6 border-l border-gray-300 h-full overflow-y-auto">
      {/* Analyze Button (Now a FontAwesome Icon) */}
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

      {/* Depth Score at the Top */}
      <DepthScore />

      <h2 className="text-xl font-bold mb-4">Depth Analysis Feedback</h2>

      {/* Tab Navigation (Instead of Large Buttons) */}
      <div className="flex border-b border-gray-400 mb-4">
        <button
          className={`flex-1 py-2 text-sm font-semibold text-center ${
            viewMode === 'general'
              ? 'border-b-2 border-blue-500 text-blue-500'
              : 'text-gray-500 hover:text-gray-700'
          }`}
          onClick={() => setViewMode('general')}
        >
          General
        </button>
        <button
          className={`flex-1 py-2 text-sm font-semibold text-center ${
            viewMode === 'inline'
              ? 'border-b-2 border-blue-500 text-blue-500'
              : 'text-gray-500 hover:text-gray-700'
          }`}
          onClick={() => setViewMode('inline')}
        >
          Inline
        </button>
      </div>

      {viewMode === 'general' ? (
        // 🔹 General Feedback
        <div>
          {error && <p className="text-red-500 mb-4">{error}</p>}

          <div className="flex-1 overflow-auto scrollbar-hide">
            {selectedDoc?.analysisData ? (
              Object.entries(selectedDoc.analysisData).map(([key, value]) => (
                <div key={key} className="mb-4">
                  <h3 className="font-bold text-black capitalize">
                    {key.replace(/([A-Z])/g, ' $1')}
                  </h3>
                  <p className="text-gray-700 text-sm">
                    {value || 'No feedback provided.'}
                  </p>
                </div>
              ))
            ) : (
              <p className="text-gray-500 text-sm">
                Click the analyze icon to get feedback.
              </p>
            )}
          </div>
        </div>
      ) : (
        // 🔹 Inline Feedback List
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
                      selectTextInEditor(text); // 🔹 Ensure this fires correctly
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
      )}
    </aside>
  );
}
