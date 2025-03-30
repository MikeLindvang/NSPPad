'use client';

import { useState, useEffect } from 'react';
import NonfictionTemplates from '@/lib/NonfictionTemplates';

export default function NonfictionBookSetup({ project, onContinue }) {
  const [length, setLength] = useState('standard');
  const [template, setTemplate] = useState('problem-buster');
  const [tone, setTone] = useState('friendly');
  const [audience, setAudience] = useState('');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(null);

  // Load initial values from project when it changes
  useEffect(() => {
    const setup = project?.metadata?.bookSetup || {};
    setLength(setup.length || 'standard');
    setTemplate(setup.template || 'problem-buster');
    setTone(setup.tone || 'friendly');
    setAudience(setup.audience || '');
  }, [project]);

  const handleSubmit = async () => {
    setSaving(true);
    setError(null);

    try {
      const updatedMetadata = {
        ...(project.metadata || {}),
        bookSetup: {
          length,
          template,
          tone,
          audience,
        },
      };

      const res = await fetch(`/api/projects/${project._id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ metadata: updatedMetadata }),
      });

      if (!res.ok) throw new Error('Failed to update book setup');

      const updated = await res.json();
      if (onContinue) onContinue(updated); // ✅ Pass updated project back up
    } catch (err) {
      console.error('❌ Error saving book setup:', err);
      setError('Something went wrong. Try again.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="p-10 max-w-2xl mx-auto">
      <h2 className="text-3xl font-bold mb-6">📘 Nonfiction Book Setup</h2>

      <div className="mb-4">
        <label className="font-semibold block mb-1">Book Length</label>
        <select
          className="w-full border rounded p-2"
          value={length}
          onChange={(e) => setLength(e.target.value)}
        >
          <option value="short">Short Report (20 pages)</option>
          <option value="standard">Standard Ebook (40–80 pages)</option>
          <option value="advanced">Advanced Guide (80+ pages)</option>
        </select>
      </div>

      <div className="mb-4">
        <label className="font-semibold block mb-1">Template Structure</label>
        <select
          className="w-full border rounded p-2"
          value={template}
          onChange={(e) => setTemplate(e.target.value)}
        >
          {Object.entries(NonfictionTemplates).map(([key, value]) => (
            <option key={key} value={key}>
              {value.name || value.label || key}
            </option>
          ))}
        </select>
      </div>

      <div className="mb-4">
        <label className="font-semibold block mb-1">Tone / Style</label>
        <select
          className="w-full border rounded p-2"
          value={tone}
          onChange={(e) => setTone(e.target.value)}
        >
          <option value="friendly">Friendly & Conversational</option>
          <option value="professional">Professional & Authoritative</option>
          <option value="motivational">Motivational & Energetic</option>
          <option value="calm">Calm & Reassuring</option>
        </select>
      </div>

      <div className="mb-6">
        <label className="font-semibold block mb-1">
          Target Audience (optional)
        </label>
        <input
          type="text"
          className="w-full border rounded p-2"
          value={audience}
          onChange={(e) => setAudience(e.target.value)}
          placeholder="e.g. freelancers, coaches, beginners"
        />
      </div>

      {error && <p className="text-red-500 mb-4">{error}</p>}

      <button
        onClick={handleSubmit}
        className="bg-blue-600 text-white py-2 px-6 rounded hover:bg-blue-700"
        disabled={saving}
      >
        {saving ? 'Saving...' : 'Continue to Outline'}
      </button>
    </div>
  );
}
