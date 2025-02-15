'use client';

import { useState, useEffect } from 'react';
import { optionDescriptions } from '../../lib/bookStyleOptions'; // ✅ Import shared descriptions

export default function BookStyleManager() {
  const [bookStyles, setBookStyles] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [showModal, setShowModal] = useState(false);
  const [editingStyle, setEditingStyle] = useState(null);

  const [formData, setFormData] = useState({
    name: '',
    genre: '',
    themes: '',
    tone: 'Balanced',
    pacing: 'Moderate', // ✅ Added pacing
    worldBuildingDepth: 'Moderate',
    characterFocus: 'Balanced',
    plotComplexity: 'Moderate Complexity',
  });

  // ✅ Safe retrieval of descriptions (prevents crashes)
  const getOptionDescription = (category, value) => {
    if (!value) return 'No description available'; // ✅ Prevents null/undefined errors
    return (
      optionDescriptions?.[category]?.[value] || 'No description available'
    );
  };

  useEffect(() => {
    async function fetchBookStyles() {
      try {
        const response = await fetch('/api/user/bookstyle');
        if (!response.ok) throw new Error('Failed to load book styles');
        const data = await response.json();

        // ✅ Ensure no missing properties
        setBookStyles(
          data.map((style) => ({
            ...style,
            tone: style.tone || 'Balanced',
            worldBuildingDepth: style.worldBuildingDepth || 'Moderate',
            characterFocus: style.characterFocus || 'Balanced',
            plotComplexity: style.plotComplexity || 'Moderate Complexity',
            descriptions: {
              tone: getOptionDescription('tone', style.tone || 'Balanced'),
              worldBuildingDepth: getOptionDescription(
                'worldBuildingDepth',
                style.worldBuildingDepth || 'Moderate'
              ),
              characterFocus: getOptionDescription(
                'characterFocus',
                style.characterFocus || 'Balanced'
              ),
              plotComplexity: getOptionDescription(
                'plotComplexity',
                style.plotComplexity || 'Moderate Complexity'
              ),
            },
          }))
        );
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    }

    fetchBookStyles();
  }, []);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const openEditModal = (style) => {
    setEditingStyle(style);
    setFormData({
      name: style.name || '',
      genre: style.genre || '',
      themes: Array.isArray(style.themes) ? style.themes.join(', ') : '',
      tone: style.tone || 'Balanced',
      pacing: style.pacing || 'Moderate', // ✅ Ensure pacing is preloaded
      worldBuildingDepth: style.worldBuildingDepth || 'Moderate',
      characterFocus: style.characterFocus || 'Balanced',
      plotComplexity: style.plotComplexity || 'Moderate Complexity',
    });
    setShowModal(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    try {
      const url = '/api/user/bookstyle';
      const method = editingStyle ? 'PUT' : 'POST';
      const bodyData = {
        ...(editingStyle ? { _id: editingStyle._id } : {}),
        ...formData,
        themes: formData.themes
          ? formData.themes.split(',').map((t) => t.trim())
          : [],
      };

      const response = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(bodyData),
      });

      if (!response.ok) throw new Error('Failed to save book style');

      const savedStyle = await response.json();

      setBookStyles((prev) =>
        editingStyle
          ? prev.map((style) =>
              style._id === savedStyle._id ? savedStyle : style
            )
          : [...prev, savedStyle]
      );

      setShowModal(false);
      setEditingStyle(null);
      resetForm();
    } catch (err) {
      setError(err.message);
    }
  };

  const handleDelete = async (id) => {
    if (!confirm('Are you sure you want to delete this Book Style?')) return;

    try {
      const response = await fetch('/api/user/bookstyle', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id }),
      });

      if (!response.ok) throw new Error('Failed to delete book style');

      setBookStyles((prev) => prev.filter((style) => style._id !== id));
    } catch (err) {
      setError(err.message);
    }
  };

  const resetForm = () => {
    setFormData({
      name: '',
      genre: '',
      themes: '',
      tone: 'Balanced',
      worldBuildingDepth: 'Moderate',
      characterFocus: 'Balanced',
      plotComplexity: 'Moderate Complexity',
    });
  };

  return (
    <div>
      <h2 className="text-xl font-semibold mb-4">Manage Your Book Styles</h2>

      <button
        onClick={() => {
          setEditingStyle(null);
          setShowModal(true);
        }}
        className="px-4 py-2 bg-blue-500 text-white rounded-md hover:bg-blue-600"
      >
        + Create New Book Style
      </button>

      {loading && <p>Loading book styles...</p>}
      {error && <p className="text-red-500">{error}</p>}

      {!loading && !error && (
        <ul className="list-none pl-5 mt-4">
          {bookStyles.map((style) => (
            <li
              key={style._id}
              className="mb-2 flex flex-col gap-1 p-2 border rounded-lg shadow-sm"
            >
              <div className="font-bold">
                {style.name} - {style.genre}
              </div>
              <div>
                <strong>Tone:</strong> {style.tone}{' '}
                <em>({getOptionDescription('tone', style.tone)})</em>
              </div>
              <div>
                <strong>Pacing:</strong> {style.pacing || 'Moderate'}
              </div>

              <div>
                <strong>World-Building Depth:</strong>{' '}
                {style.worldBuildingDepth}{' '}
                <em>
                  (
                  {getOptionDescription(
                    'worldBuildingDepth',
                    style.worldBuildingDepth
                  )}
                  )
                </em>
              </div>
              <div>
                <strong>Character Focus:</strong> {style.characterFocus}{' '}
                <em>
                  (
                  {getOptionDescription('characterFocus', style.characterFocus)}
                  )
                </em>
              </div>
              <div>
                <strong>Plot Complexity:</strong> {style.plotComplexity}{' '}
                <em>
                  (
                  {getOptionDescription('plotComplexity', style.plotComplexity)}
                  )
                </em>
              </div>

              <div className="mt-2 space-x-2">
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
              </div>
            </li>
          ))}
        </ul>
      )}

      {/* 🔹 Modal for Adding/Editing a Book Style */}
      {showModal && (
        <div className="fixed inset-0 bg-gray-900 bg-opacity-50 flex items-center justify-center">
          <div className="bg-white p-6 rounded-lg shadow-lg max-w-md w-full">
            <h3 className="text-lg font-bold mb-4">
              {editingStyle ? 'Edit Book Style' : 'Create New Book Style'}
            </h3>
            <form onSubmit={handleSubmit}>
              <label className="block mb-2">
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

              <label className="block mb-2">
                Genre:
                <input
                  type="text"
                  name="genre"
                  value={formData.genre}
                  onChange={handleInputChange}
                  className="w-full border p-2 rounded"
                  required
                />
              </label>

              <label className="block mb-2">
                Themes (comma-separated):
                <input
                  type="text"
                  name="themes"
                  value={formData.themes}
                  onChange={handleInputChange}
                  className="w-full border p-2 rounded"
                />
              </label>

              <label className="block mb-2">
                Tone:
                <select
                  name="tone"
                  value={formData.tone}
                  onChange={handleInputChange}
                  className="w-full border p-2 rounded"
                >
                  {Object.entries(optionDescriptions.tone).map(
                    ([key, desc]) => (
                      <option key={key} value={key} title={desc}>
                        {key}
                      </option>
                    )
                  )}
                </select>
              </label>
              <label className="block mb-2">
                Pacing:
                <select
                  name="pacing"
                  value={formData.pacing}
                  onChange={handleInputChange}
                  className="w-full border p-2 rounded"
                >
                  <option value="Slow">Slow</option>
                  <option value="Moderate">Moderate</option>
                  <option value="Fast-Paced">Fast-Paced</option>
                  <option value="Breakneck">Breakneck</option>
                </select>
              </label>

              <label className="block mb-2">
                World-Building Depth:
                <select
                  name="worldBuildingDepth"
                  value={formData.worldBuildingDepth}
                  onChange={handleInputChange}
                  className="w-full border p-2 rounded"
                >
                  {Object.entries(optionDescriptions.worldBuildingDepth).map(
                    ([key, desc]) => (
                      <option key={key} value={key} title={desc}>
                        {key}
                      </option>
                    )
                  )}
                </select>
              </label>

              <label className="block mb-2">
                Character Focus:
                <select
                  name="characterFocus"
                  value={formData.characterFocus}
                  onChange={handleInputChange}
                  className="w-full border p-2 rounded"
                >
                  {Object.entries(optionDescriptions.characterFocus).map(
                    ([key, desc]) => (
                      <option key={key} value={key} title={desc}>
                        {key}
                      </option>
                    )
                  )}
                </select>
              </label>

              <label className="block mb-2">
                Plot Complexity:
                <select
                  name="plotComplexity"
                  value={formData.plotComplexity}
                  onChange={handleInputChange}
                  className="w-full border p-2 rounded"
                >
                  {Object.entries(optionDescriptions.plotComplexity).map(
                    ([key, desc]) => (
                      <option key={key} value={key} title={desc}>
                        {key}
                      </option>
                    )
                  )}
                </select>
              </label>

              <button
                type="submit"
                className="px-4 py-2 bg-blue-500 text-white rounded-md hover:bg-blue-600"
              >
                {editingStyle ? 'Save Changes' : 'Create'}
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
