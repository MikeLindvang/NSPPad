'use client';

import { useState, useEffect } from 'react';
import { authorStyleOptions } from '../../lib/authorStyleOptions';

export default function AuthorStyleManager() {
  const [authorStyles, setAuthorStyles] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [showModal, setShowModal] = useState(false);
  const [editingStyle, setEditingStyle] = useState(null);
  const [formData, setFormData] = useState({
    name: '',
    narrativeVoice: 'Third-person limited',
    sentenceStructure: 'Balanced',
    formality: 'Neutral',
    useOfMetaphors: 'Medium',
    pacingPreference: 'Moderate',
    dialogueStyle: 'Realistic',
    descriptiveLevel: 5,
    writingRhythm: 'Flowing',
    wordChoice: 'Varied',
    emotionalDepth: 'Deep',
    humorStyle: 'Subtle',
  });

  const getAuthorStyleOptions = (category, value) => {
    if (!value) return 'No description available';
    return authorStyleOptions[category][value] || 'No description available';
  };

  useEffect(() => {
    async function fetchAuthorStyles() {
      try {
        const response = await fetch('/api/user/authorstyle');
        if (!response.ok) throw new Error('Failed to load author styles');
        const data = await response.json();
        setAuthorStyles(
          data.map((style) => ({
            ...style,
            narrativeVoiceDescription: getAuthorStyleOptions(
              'narrativeVoice',
              style.narrativeVoice
            ),
            sentenceStructureDescription: getAuthorStyleOptions(
              'sentenceStructure',
              style.sentenceStructure
            ),
            formalityDescription: getAuthorStyleOptions(
              'formality',
              style.formality
            ),
            useOfMetaphorsDescription: getAuthorStyleOptions(
              'useOfMetaphors',
              style.useOfMetaphors
            ),
            pacingPreferenceDescription: getAuthorStyleOptions(
              'pacingPreference',
              style.pacingPreference
            ),
            dialogueStyleDescription: getAuthorStyleOptions(
              'dialogueStyle',
              style.dialogueStyle
            ),
            writingRhythmDescription: getAuthorStyleOptions(
              'writingRhythm',
              style.writingRhythm
            ),
            wordChoiceDescription: getAuthorStyleOptions(
              'wordChoice',
              style.wordChoice
            ),
            emotionalDepthDescription: getAuthorStyleOptions(
              'emotionalDepth',
              style.emotionalDepth
            ),
            humorStyleDescription: getAuthorStyleOptions(
              'humorStyle',
              style.humorStyle
            ),
          }))
        );
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    }

    fetchAuthorStyles();
  }, []);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const openEditModal = (style) => {
    setEditingStyle(style);
    setFormData({
      name: style.name || '',
      narrativeVoice: style.narrativeVoice || 'Third-person limited',
      sentenceStructure: style.sentenceStructure || 'Balanced',
      formality: style.formality || 'Neutral',
      useOfMetaphors: style.useOfMetaphors || 'Medium',
      pacingPreference: style.pacingPreference || 'Moderate',
      dialogueStyle: style.dialogueStyle || 'Realistic',
      descriptiveLevel: style.descriptiveLevel || 5,
      writingRhythm: style.writingRhythm || 'Flowing',
      wordChoice: style.wordChoice || 'Varied',
      emotionalDepth: style.emotionalDepth || 'Deep',
      humorStyle: style.humorStyle || 'Subtle',
    });
    setShowModal(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    try {
      const url = '/api/user/authorstyle';
      const method = editingStyle ? 'PUT' : 'POST';
      const bodyData = editingStyle
        ? { _id: editingStyle._id, ...formData }
        : formData;

      const response = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(bodyData),
      });

      if (!response.ok) throw new Error('Failed to save author style');

      const savedStyle = await response.json();

      if (editingStyle) {
        setAuthorStyles((prev) =>
          prev.map((style) =>
            style._id === savedStyle._id ? savedStyle : style
          )
        );
      } else {
        setAuthorStyles([...authorStyles, savedStyle]);
      }

      setShowModal(false);
      setEditingStyle(null);
      setFormData({
        name: '',
        narrativeVoice: 'Third-person limited',
        sentenceStructure: 'Balanced',
        formality: 'Neutral',
        useOfMetaphors: 'Medium',
        pacingPreference: 'Moderate',
        dialogueStyle: 'Realistic',
        descriptiveLevel: 5,
        writingRhythm: 'Flowing',
        wordChoice: 'Varied',
        emotionalDepth: 'Deep',
        humorStyle: 'Subtle',
      });
    } catch (err) {
      setError(err.message);
    }
  };

  const handleDelete = async (id) => {
    if (!confirm('Are you sure you want to delete this Author Style?')) return;

    try {
      const response = await fetch('/api/user/authorstyle', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id }),
      });

      if (!response.ok) throw new Error('Failed to delete author style');

      // 🔹 Update UI instantly by removing the deleted item
      setAuthorStyles((prev) => prev.filter((style) => style._id !== id));
    } catch (err) {
      setError(err.message);
    }
  };

  const handleSetDefault = async (id) => {
    try {
      const response = await fetch('/api/user/authorstyle', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id, defaultStyle: true }),
      });

      if (!response.ok) throw new Error('Failed to set default author style');

      const updatedStyle = await response.json();

      // Update UI to mark the selected style as default and unset others
      setAuthorStyles((prev) =>
        prev.map((style) =>
          style._id === updatedStyle._id
            ? { ...style, defaultStyle: true }
            : { ...style, defaultStyle: false }
        )
      );
    } catch (err) {
      setError(err.message);
    }
  };

  return (
    <div>
      <h2 className="text-xl font-semibold mb-4">Manage Your Author Styles</h2>

      <button
        onClick={() => {
          setEditingStyle(null);
          setShowModal(true);
        }}
        className="px-4 py-2 bg-blue-500 text-white rounded-md hover:bg-blue-600"
      >
        + Create New Author Style
      </button>

      {loading && <p>Loading author styles...</p>}
      {error && <p className="text-red-500">{error}</p>}

      {!loading && !error && (
        <ul className="list-none pl-5 mt-4">
          {authorStyles.map((style) => (
            <li
              key={style._id}
              className="mb-2 flex flex-col gap-1 p-2 border rounded-lg shadow-sm"
            >
              <div>
                <div className="font-bold">
                  {/*style.defaultStyle ? '⭐' : ''*/} {style.name}
                </div>
                <div>
                  <strong>Narrative voice:</strong> {style.narrativeVoice}{' '}
                  <em>
                    {getAuthorStyleOptions(
                      'narrativeVoice',
                      style.narrativeVoice
                    )}
                  </em>
                </div>
                <div>
                  <strong>Sentence structure:</strong> {style.sentenceStructure}{' '}
                  <em>
                    {getAuthorStyleOptions(
                      'sentenceStructure',
                      style.sentenceStructure
                    )}
                  </em>
                </div>
                <div>
                  <strong>Formality:</strong> {style.formality}{' '}
                  <em>{getAuthorStyleOptions('formality', style.formality)}</em>
                </div>
                <div>
                  <strong>Use of metaphors:</strong> {style.useOfMetaphors}{' '}
                  <em>
                    {getAuthorStyleOptions(
                      'useOfMetaphors',
                      style.useOfMetaphors
                    )}
                  </em>
                </div>
                <div>
                  <strong>Pacing preference:</strong> {style.pacingPreference}{' '}
                  <em>
                    {getAuthorStyleOptions(
                      'pacingPreference',
                      style.pacingPreference
                    )}
                  </em>
                </div>
                <div>
                  <strong>Dialogue style:</strong> {style.dialogueStyle}{' '}
                  <em>
                    {getAuthorStyleOptions(
                      'dialogueStyle',
                      style.dialogueStyle
                    )}
                  </em>
                </div>
                <div>
                  <strong>Descriptive level:</strong> {style.descriptiveLevel}{' '}
                  <em>
                    {getAuthorStyleOptions(
                      'descriptiveLevel',
                      style.descriptiveLevel
                    )}
                  </em>
                </div>
                <div>
                  <strong>Writing rhythm:</strong> {style.writingRhythm}{' '}
                  <em>
                    {getAuthorStyleOptions(
                      'writingRhythm',
                      style.writingRhythm
                    )}
                  </em>
                </div>
                <div>
                  <strong>Word choice:</strong> {style.wordChoice}{' '}
                  <em>
                    {getAuthorStyleOptions('wordChoice', style.wordChoice)}
                  </em>
                </div>
                <div>
                  <strong>Emotional depth:</strong> {style.emotionalDepth}{' '}
                  <em>
                    {getAuthorStyleOptions(
                      'emotionalDepth',
                      style.emotionalDepth
                    )}
                  </em>
                </div>
                <div>
                  <strong>Humor style:</strong> {style.humorStyle}{' '}
                  <em>
                    {getAuthorStyleOptions('humorStyle', style.humorStyle)}
                  </em>
                </div>
              </div>
              <div className="space-x-2">
                <button
                  onClick={() => openEditModal(style)}
                  className="px-3 py-1 bg-yellow-500 text-white rounded-md hover:bg-yellow-600"
                >
                  Edit
                </button>
                <button
                  onClick={() => handleDelete(style._id)}
                  className="px-3 py-1 bg-red-500 text-white rounded-md hover:bg-red-600"
                >
                  🗑 Delete
                </button>
                {!style.defaultStyle && (
                  <button
                    onClick={() => handleSetDefault(style._id)}
                    className="px-3 py-1 bg-green-500 text-white rounded-md hover:bg-green-600"
                  >
                    Set as Default
                  </button>
                )}
              </div>
            </li>
          ))}
        </ul>
      )}

      {showModal && (
        <div className="fixed inset-0 bg-gray-900 bg-opacity-50 flex items-center justify-center">
          <div className="bg-white p-6 rounded-lg shadow-lg max-w-2xl w-full">
            <h3 className="text-lg font-bold mb-4">
              {editingStyle ? 'Edit Author Style' : 'Create New Author Style'}
            </h3>
            <form onSubmit={handleSubmit}>
              <div className="grid grid-cols-2 gap-4">
                {/* Name Input */}
                <label className="block col-span-2">
                  Name:
                  <input
                    type="text"
                    name="name"
                    value={formData.name}
                    onChange={handleInputChange}
                    className="w-full border p-2 rounded"
                    required
                  />
                </label>

                {/* Narrative Voice */}
                <label className="block">
                  Narrative Voice:
                  <select
                    name="narrativeVoice"
                    value={formData.narrativeVoice}
                    onChange={handleInputChange}
                    className="w-full border p-2 rounded"
                  >
                    <option value="First-person">First-person</option>
                    <option value="First-person unreliable">
                      First-person unreliable
                    </option>
                    <option value="Third-person limited">
                      Third-person limited
                    </option>
                    <option value="Third-person multiple">
                      Third-person multiple
                    </option>
                    <option value="Third-person omniscient">
                      Third-person omniscient
                    </option>
                    <option value="Third-person cinematic">
                      Third-person cinematic
                    </option>
                    <option value="Second-person">Second-person</option>
                  </select>
                </label>

                {/* Sentence Structure */}
                <label className="block">
                  Sentence Structure:
                  <select
                    name="sentenceStructure"
                    value={formData.sentenceStructure}
                    onChange={handleInputChange}
                    className="w-full border p-2 rounded"
                  >
                    <option value="Simple">Simple</option>
                    <option value="Balanced">Balanced</option>
                    <option value="Complex">Complex</option>
                    <option value="Choppy & Fragmented">
                      Choppy & Fragmented
                    </option>
                    <option value="Poetic & Flowing">Poetic & Flowing</option>
                  </select>
                </label>

                {/* Formality */}
                <label className="block">
                  Formality:
                  <select
                    name="formality"
                    value={formData.formality}
                    onChange={handleInputChange}
                    className="w-full border p-2 rounded"
                  >
                    <option value="Informal">Informal</option>
                    <option value="Neutral">Neutral</option>
                    <option value="Formal">Formal</option>
                    <option value="Highly Stylized">Highly Stylized</option>
                  </select>
                </label>

                {/* Use of Metaphors */}
                <label className="block">
                  Use of Metaphors:
                  <select
                    name="useOfMetaphors"
                    value={formData.useOfMetaphors}
                    onChange={handleInputChange}
                    className="w-full border p-2 rounded"
                  >
                    <option value="Low">Low</option>
                    <option value="Medium">Medium</option>
                    <option value="High">High</option>
                    <option value="Surreal & Symbolic">
                      Surreal & Symbolic
                    </option>
                  </select>
                </label>

                {/* Pacing Preference */}
                <label className="block">
                  Pacing Preference:
                  <select
                    name="pacingPreference"
                    value={formData.pacingPreference}
                    onChange={handleInputChange}
                    className="w-full border p-2 rounded"
                  >
                    <option value="Fast">Fast</option>
                    <option value="Moderate">Moderate</option>
                    <option value="Slow & Deliberate">Slow & Deliberate</option>
                    <option value="Erratic">Erratic</option>
                  </select>
                </label>

                {/* Dialogue Style */}
                <label className="block">
                  Dialogue Style:
                  <select
                    name="dialogueStyle"
                    value={formData.dialogueStyle}
                    onChange={handleInputChange}
                    className="w-full border p-2 rounded"
                  >
                    <option value="Minimal">Minimal</option>
                    <option value="Realistic">Realistic</option>
                    <option value="Heavy">Heavy</option>
                    <option value="Stylized & Theatrical">
                      Stylized & Theatrical
                    </option>
                    <option value="Snappy & Witty">Snappy & Witty</option>
                  </select>
                </label>

                {/* Writing Rhythm */}
                <label className="block">
                  Writing Rhythm:
                  <select
                    name="writingRhythm"
                    value={formData.writingRhythm}
                    onChange={handleInputChange}
                    className="w-full border p-2 rounded"
                  >
                    <option value="Staccato">Staccato</option>
                    <option value="Flowing">Flowing</option>
                    <option value="Dense & Layered">Dense & Layered</option>
                    <option value="Erratic">Erratic</option>
                  </select>
                </label>

                {/* Word Choice */}
                <label className="block">
                  Word Choice:
                  <select
                    name="wordChoice"
                    value={formData.wordChoice}
                    onChange={handleInputChange}
                    className="w-full border p-2 rounded"
                  >
                    <option value="Simple & Direct">Simple & Direct</option>
                    <option value="Varied">Varied</option>
                    <option value="Evocative & Lyrical">
                      Evocative & Lyrical
                    </option>
                    <option value="Academic & Precise">
                      Academic & Precise
                    </option>
                  </select>
                </label>

                {/* Emotional Depth */}
                <label className="block">
                  Emotional Depth:
                  <select
                    name="emotionalDepth"
                    value={formData.emotionalDepth}
                    onChange={handleInputChange}
                    className="w-full border p-2 rounded"
                  >
                    <option value="Shallow">Shallow</option>
                    <option value="Moderate">Moderate</option>
                    <option value="Deep">Deep</option>
                    <option value="Overwhelming">Overwhelming</option>
                  </select>
                </label>

                {/* Humor Style */}
                <label className="block">
                  Humor Style:
                  <select
                    name="humorStyle"
                    value={formData.humorStyle}
                    onChange={handleInputChange}
                    className="w-full border p-2 rounded"
                  >
                    <option value="None">None</option>
                    <option value="Dark">Dark</option>
                    <option value="Subtle">Subtle</option>
                    <option value="Sarcastic">Sarcastic</option>
                    <option value="Absurd & Satirical">
                      Absurd & Satirical
                    </option>
                  </select>
                </label>

                {/* Descriptive Level */}
                <label className="block col-span-2">
                  Descriptive Level (1-10):
                  <input
                    type="number"
                    name="descriptiveLevel"
                    value={formData.descriptiveLevel}
                    onChange={handleInputChange}
                    className="w-full border p-2 rounded"
                    min="1"
                    max="10"
                  />
                </label>
              </div>

              {/* Form Buttons */}
              <div className="flex justify-end mt-4">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="px-4 py-2 bg-gray-400 text-white rounded-md hover:bg-gray-500 mr-2"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-blue-500 text-white rounded-md hover:bg-blue-600"
                >
                  {editingStyle ? 'Save Changes' : 'Create'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
