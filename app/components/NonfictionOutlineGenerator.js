'use client';

import { useState, useEffect } from 'react';

export default function NonfictionOutlineGenerator({ project, onContinue }) {
  const bookSetup = project?.metadata?.bookSetup || {};

  const [topic, setTopic] = useState('');
  const [sections, setSections] = useState([]);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    const outline = project?.metadata?.outline || {};
    setTopic((prev) => prev || outline.topic || '');
    setSections((prev) => (prev.length ? prev : outline.sections || []));
  }, [project]);

  const handleGenerate = async () => {
    console.log('GENERATING OUTLINE');
    if (!topic.trim()) {
      alert('Please enter a topic first.');
      return;
    }

    const bookSetup = project?.metadata?.bookSetup;

    if (!bookSetup?.template || !bookSetup?.length) {
      alert('Book setup information is missing or incomplete.');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const res = await fetch('/api/nonfiction/outline', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ topic, bookSetup }),
      });

      const data = await res.json();
      console.log('DATA FROM REQUEST', data);
      if (!res.ok) throw new Error(data.error || 'Failed to generate outline');

      setSections(data.sections || []);
    } catch (err) {
      console.error(err);
      setError('Could not generate outline. Try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleSectionChange = (index, field, value) => {
    const updated = [...sections];
    updated[index][field] = value;
    setSections(updated);
  };

  const handleAddSection = () => {
    setSections([...sections, { title: '', notes: '' }]);
  };

  const handleRemoveSection = (index) => {
    const updated = sections.filter((_, i) => i !== index);
    setSections(updated);
  };

  const handleSave = async () => {
    setSaving(true);
    setError(null);

    try {
      const updatedMetadata = {
        ...project.metadata,
        outline: {
          topic,
          sections,
        },
      };

      const res = await fetch(`/api/projects/${project._id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ metadata: updatedMetadata }),
      });

      if (!res.ok) throw new Error('Failed to save outline');
      const updatedProject = await res.json();

      if (onContinue) onContinue(updatedProject); // ✅ Pass updated project upward
    } catch (err) {
      console.error(err);
      setError('Could not save outline. Try again.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="p-10 max-w-3xl mx-auto">
      <h2 className="text-3xl font-bold mb-6">🧠 Outline Generator</h2>

      <div className="mb-4">
        <label className="font-semibold block mb-1">
          What is your book about?
        </label>
        <textarea
          type="text"
          className="w-full border rounded p-2"
          rows={3}
          value={topic}
          onChange={(e) => setTopic(e.target.value)}
          placeholder="e.g. How to launch a freelance business"
        />
      </div>

      <button
        onClick={handleGenerate}
        disabled={loading}
        className="mb-6 bg-blue-600 text-white py-2 px-6 rounded hover:bg-blue-700"
      >
        {loading ? 'Generating...' : 'Generate Outline'}
      </button>

      {error && <p className="text-red-500 mb-4">{error}</p>}

      {sections.length > 0 && (
        <>
          <h3 className="text-xl font-bold mb-3">Edit Outline</h3>
          {sections.map((section, index) => (
            <div key={index} className="mb-4 border p-4 rounded">
              <input
                className="w-full mb-2 border rounded p-2 font-semibold"
                value={section.title}
                onChange={(e) =>
                  handleSectionChange(index, 'title', e.target.value)
                }
                placeholder={`Section ${index + 1} Title`}
              />
              <textarea
                className="w-full border rounded p-2"
                rows={3}
                value={section.notes}
                onChange={(e) =>
                  handleSectionChange(index, 'notes', e.target.value)
                }
                placeholder="What will this section cover?"
              />
              <button
                onClick={() => handleRemoveSection(index)}
                className="mt-2 text-red-600 hover:underline"
              >
                Remove
              </button>
            </div>
          ))}

          <button
            onClick={handleAddSection}
            className="mb-6 bg-gray-300 text-black py-2 px-4 rounded hover:bg-gray-400"
          >
            + Add Section
          </button>

          <button
            onClick={handleSave}
            disabled={saving}
            className="ml-4 bg-green-600 text-white py-2 px-6 rounded hover:bg-green-700"
          >
            {saving ? 'Saving...' : 'Continue to Chapter Creation'}
          </button>
        </>
      )}
    </div>
  );
}
