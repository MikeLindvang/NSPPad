import { useState, useEffect } from 'react';
import { MdOutlineAutorenew } from 'react-icons/md';
import { FaSyncAlt } from 'react-icons/fa';
import DepthScore from '../components/DepthScore';
import { useDocument } from '../context/DocumentContext';
import { useEditor } from '../context/EditorContext';
import { useProject } from '../context/ProjectContext';

export default function AnalysisSidebar() {
  const { selectedDoc, setSelectedDoc, updateDocument } = useDocument();
  const { project } = useProject();
  const { editor } = useEditor();

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

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
          projectId: project._id,
          docId: selectedDoc._id,
          text: selectedDoc.content,
        }),
      });

      const result = await response.json();

      if (!response.ok)
        throw new Error(result.error || 'Failed to analyze text');

      setSelectedDoc((prev) => ({
        ...prev,
        analysisHtml: result.analysisHtml,
      }));

      await updateDocument(selectedDoc._id, {
        analysisHtml: result.analysisHtml,
      });
    } catch (err) {
      console.error('❌ Error analyzing text:', err);
      setError('Failed to analyze text. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const handleKeyDown = (event) => {
      if (event.ctrlKey && event.altKey && event.key.toLowerCase() === 'a') {
        event.preventDefault();
        console.log('🔍 Analysis triggered via shortcut!');
        analyze();
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
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

      <h2 className="text-xl font-bold mb-4">Depth Improvement Suggestions</h2>

      {error && <p className="text-red-500 mb-4">{error}</p>}

      <div
        className="space-y-4"
        dangerouslySetInnerHTML={{
          __html: selectedDoc?.analysisHtml || '<p>No analysis available.</p>',
        }}
      />
    </aside>
  );
}
