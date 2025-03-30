'use client';

import { useState, useEffect } from 'react';

export default function NonfictionChapterCreator({ project, onContinue }) {
  const [creating, setCreating] = useState(false);
  const [error, setError] = useState(null);

  const [outlineSections, setOutlineSections] = useState([]);

  useEffect(() => {
    const sections = project?.metadata?.outline?.sections || [];
    setOutlineSections(sections);
  }, [project]);

  console.log('OUTLINE SECTIONS: ', outlineSections);
  console.log('PROCJECT: ', project);

  const handleCreateChapters = async () => {
    if (outlineSections.length === 0) {
      setError('No outline found. Please complete the outline step first.');
      return;
    }

    setCreating(true);
    setError(null);

    try {
      const res = await fetch(`/api/projects/${project._id}/chapters`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ outline: outlineSections }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to create chapters');

      // ✅ Fetch updated project including generated documents
      const refreshed = await fetch(`/api/projects/${project._id}`);
      const updatedProject = await refreshed.json();

      if (onContinue) onContinue(updatedProject);
    } catch (err) {
      console.error(err);
      setError('Could not create chapters. Try again.');
    } finally {
      setCreating(false);
    }
  };

  return (
    <div className="p-10 max-w-2xl mx-auto">
      <h2 className="text-3xl font-bold mb-6">📄 Create Chapters</h2>
      <p className="mb-6 text-gray-700">
        Based on your outline, we’ll now generate one document for each section
        so you can begin writing.
      </p>

      {outlineSections.length === 0 ? (
        <p className="text-red-500 font-semibold mb-6">
          ⚠️ No outline found. Please go back and complete the outline step.
        </p>
      ) : (
        <div className="mb-6">
          <h3 className="text-xl font-semibold mb-2">🧠 Outline Summary</h3>
          <ul className="list-disc list-inside space-y-2 text-gray-800">
            {outlineSections.map((section, i) => (
              <li key={i}>
                <strong>{section.title || `Untitled Section ${i + 1}`}</strong>
                {section.notes && (
                  <div className="text-sm text-gray-600 ml-2">
                    {section.notes}
                  </div>
                )}
              </li>
            ))}
          </ul>
        </div>
      )}

      {error && <p className="text-red-500 mb-4">{error}</p>}

      <button
        onClick={handleCreateChapters}
        disabled={creating || outlineSections.length === 0}
        className="bg-green-600 text-white py-2 px-6 rounded hover:bg-green-700 disabled:opacity-50"
      >
        {creating ? 'Creating Chapters...' : 'Create Chapters from Outline'}
      </button>
    </div>
  );
}
