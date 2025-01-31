'use client';

import { useState, useEffect, useContext } from 'react';
import { ProjectContext } from '../context/ProjectContext';

export default function AnalysisSidebar() {
  const { selectedDoc, updateDocument, saveDocument } =
    useContext(ProjectContext);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [lastAnalysisTime, setLastAnalysisTime] = useState(null);

  // Trigger analysis for the document
  const analyzeText = async () => {
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
        body: JSON.stringify({ text: selectedDoc.content }),
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || 'Failed to analyze text');
      }

      // Update document with analysis data
      updateDocument(selectedDoc._id, {
        analysisData: result.suggestions,
        analysisScore: result.score,
      });

      // Persist the analysis results
      await saveDocument(selectedDoc._id, {
        analysisData: result.suggestions,
        analysisScore: result.score,
      });

      setLastAnalysisTime(new Date());
    } catch (err) {
      console.error('Error analyzing text:', err);
      setError('Failed to analyze text. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  // Auto-trigger analysis every 5 minutes
  useEffect(() => {
    const interval = setInterval(() => {
      const fiveMinutesPassed =
        lastAnalysisTime &&
        new Date().getTime() - lastAnalysisTime.getTime() > 5 * 60 * 1000;

      if (selectedDoc?.content && !loading && fiveMinutesPassed) {
        console.log('Triggering auto-analysis...');
        analyzeText();
      }
    }, 60000); // Check every minute

    return () => clearInterval(interval);
  }, [selectedDoc, lastAnalysisTime, loading]);

  // Format suggestions for display
  const formatSuggestions = (suggestions) => {
    if (!Array.isArray(suggestions)) {
      console.warn('Suggestions is not an array:', suggestions);
      return <p className="text-gray-500">No suggestions available.</p>;
    }

    return suggestions.map((item, index) => {
      const [heading, ...details] = item.split(':');
      return (
        <div key={index} className="mb-4">
          <h3 className="font-bold text-black">{heading.trim()}</h3>
          <p className="text-gray-700 text-sm">{details.join(':').trim()}</p>
        </div>
      );
    });
  };

  return (
    <div className="w-96 bg-slate-200 shadow-lg p-6 border-l border-gray-300 h-full overflow-y-auto">
      <h2 className="text-xl font-bold mb-4">Depth Analysis Feedback</h2>

      <button
        onClick={analyzeText}
        className="bg-blue-500 text-white px-4 py-2 rounded mb-4"
        disabled={loading}
      >
        {loading ? 'Analyzing...' : 'Analyze'}
      </button>

      {error && <p className="text-red-500 mb-4">{error}</p>}

      {selectedDoc?.analysisData ? (
        <div>{formatSuggestions(selectedDoc.analysisData)}</div>
      ) : (
        <p className="text-gray-500 text-sm">
          Click "Analyze" to get suggestions.
        </p>
      )}
    </div>
  );
}
