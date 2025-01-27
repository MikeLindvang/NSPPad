import { useState } from 'react';

export default function AnalysisSidebar({ text }) {
  const [analysis, setAnalysis] = useState(null);
  const [loading, setLoading] = useState(false);

  const analyzeText = async () => {
    setLoading(true);
    setAnalysis(null);

    try {
      const response = await fetch('/api/analyze', {
        method: 'POST',
        body: JSON.stringify({ text }),
        headers: { 'Content-Type': 'application/json' },
      });

      const result = await response.json();
      setAnalysis(result);
    } catch (error) {
      console.error('Error analyzing text:', error);
      setAnalysis({ error: 'Analysis failed. Please try again.' });
    } finally {
      setLoading(false);
    }
  };

  // Function to format suggestions with bolded headings
  const formatSuggestions = (suggestions) => {
    return suggestions.map((item, index) => {
      // Extract heading and details by splitting at the first colon only
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

      {analysis ? (
        <div>
          {analysis.error ? (
            <p className="text-red-500">{analysis.error}</p>
          ) : (
            <div>{formatSuggestions(analysis.suggestions)}</div>
          )}
        </div>
      ) : (
        <p className="text-gray-500 text-sm">
          Click "Analyze" to get suggestions.
        </p>
      )}
    </div>
  );
}
