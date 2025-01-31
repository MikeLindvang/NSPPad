'use client';

import { useState, useEffect, useContext } from 'react';
import { ProjectContext } from '../context/ProjectContext';
import { MdOutlineAutorenew } from 'react-icons/md'; // Spinner icon

export default function AnalysisSidebar() {
  const { project, selectedDoc, updateDocument, saveDocument, setSelectedDoc } =
    useContext(ProjectContext);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [lastAnalysisTime, setLastAnalysisTime] = useState(null);
  const [lastContentHash, setLastContentHash] = useState(null); // Track content changes

  const projectId = project?._id;

  // Ensure projectId is available before making the request
  useEffect(() => {
    if (!projectId) {
      console.warn('Project ID is undefined in context.');
    }
  }, [projectId]);

  // Function to hash content to track changes
  const hashContent = (content) => {
    if (!content) return null;
    return content.split('').reduce((hash, char) => {
      return hash + char.charCodeAt(0);
    }, 0);
  };

  // Trigger analysis for the document
  const analyzeText = async () => {
    if (!selectedDoc?.content) {
      setError('Document is empty. Add content to analyze.');
      return;
    }

    if (!projectId || !selectedDoc?._id) {
      setError('Invalid project or document ID.');
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
      console.log('Analysis result:', result);

      if (!response.ok) {
        throw new Error(result.error || 'Failed to analyze text');
      }

      // Update document with structured analysis data
      const updatedAnalysisData = {
        sensoryDetails: result.analysisData.sensoryDetails,
        povDepth: result.analysisData.povDepth,
        emotionalResonance: result.analysisData.emotionalResonance,
        conflict: result.analysisData.conflict, // ✅ Now just "conflict"
      };

      // Ensure the selectedDoc gets updated properly
      const updatedDoc = {
        ...selectedDoc,
        analysisData: updatedAnalysisData,
      };
      console.log('Updated document:', updatedDoc);

      // Update document state in ProjectContext
      updateDocument(selectedDoc._id, { analysisData: updatedAnalysisData });

      // Persist the analysis results
      await saveDocument(selectedDoc._id, {
        analysisData: updatedAnalysisData,
      });

      // ✅ Force state update by setting the selected document again
      setSelectedDoc({ ...updatedDoc });

      // Update last analysis time and content hash
      setLastAnalysisTime(new Date());
      setLastContentHash(hashContent(selectedDoc.content));
    } catch (err) {
      console.error('Error analyzing text:', err);
      setError('Failed to analyze text. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  // Auto-trigger analysis every 5 minutes if content has changed
  useEffect(() => {
    const interval = setInterval(() => {
      if (!selectedDoc?.content || loading) return;

      const contentHash = hashContent(selectedDoc.content);
      const fiveMinutesPassed =
        lastAnalysisTime &&
        new Date().getTime() - lastAnalysisTime.getTime() > 5 * 60 * 1000;

      if (fiveMinutesPassed && contentHash !== lastContentHash) {
        console.log('Triggering auto-analysis due to content change...');
        analyzeText();
      }
    }, 60000); // Check every minute

    return () => clearInterval(interval);
  }, [selectedDoc, lastAnalysisTime, lastContentHash, loading]);

  // Format structured feedback for display
  const formatFeedback = (analysisData) => {
    if (!analysisData) {
      return <p className="text-gray-500">No feedback available.</p>;
    }

    return (
      <div className="space-y-4">
        {Object.entries(analysisData).map(([key, value], index) => (
          <div key={index} className="mb-4">
            <h3 className="font-bold text-black capitalize">
              {key.replace(/([A-Z])/g, ' $1')}
            </h3>
            <p className="text-gray-700 text-sm">
              {value || 'No feedback provided.'}
            </p>
          </div>
        ))}
      </div>
    );
  };

  return (
    <div className="w-96 bg-slate-200 shadow-lg p-6 border-l border-gray-300 h-full overflow-y-auto">
      <h2 className="text-xl font-bold mb-4">Depth Analysis Feedback</h2>

      <button
        onClick={analyzeText}
        className="bg-blue-500 text-white px-4 py-2 rounded mb-4 flex items-center gap-2"
        disabled={loading}
      >
        {loading ? (
          <>
            <MdOutlineAutorenew className="animate-spin text-white text-lg" />
            Analyzing...
          </>
        ) : (
          'Analyze'
        )}
      </button>

      {error && <p className="text-red-500 mb-4">{error}</p>}

      {selectedDoc?.analysisData ? (
        formatFeedback(selectedDoc.analysisData)
      ) : (
        <p className="text-gray-500 text-sm">
          Click "Analyze" to get feedback.
        </p>
      )}
    </div>
  );
}
