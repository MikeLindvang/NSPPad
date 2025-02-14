'use client';

import { useState, useEffect } from 'react';

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
    pacing: 'Moderate',
    chapterLength: 'Medium',
    sentenceComplexity: 'Balanced',
    descriptiveLevel: 5,
    dialogueVsNarrative: 5,
    pointOfView: 'Third-Person Limited',
    tense: 'Past',
  });

  useEffect(() => {
    async function fetchBookStyles() {
      try {
        const response = await fetch('/api/user/bookstyle');
        if (!response.ok) throw new Error('Failed to load book styles');
        const data = await response.json();
        setBookStyles(data);
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
      name: style.name,
      genre: style.genre,
      themes: style.themes?.join(', ') || '',
      tone: style.tone,
      pacing: style.pacing,
      chapterLength: style.chapterLength,
      sentenceComplexity: style.sentenceComplexity,
      descriptiveLevel: style.descriptiveLevel,
      dialogueVsNarrative: style.dialogueVsNarrative,
      pointOfView: style.pointOfView,
      tense: style.tense,
    });
    setShowModal(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    try {
      const url = '/api/user/bookstyle';
      const method = editingStyle ? 'PUT' : 'POST';
      const bodyData = editingStyle
        ? { id: editingStyle._id, ...formData }
        : formData;

      const response = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(bodyData),
      });

      if (!response.ok) throw new Error('Failed to save book style');

      const savedStyle = await response.json();

      if (editingStyle) {
        setBookStyles((prev) =>
          prev.map((style) =>
            style._id === savedStyle._id ? savedStyle : style
          )
        );
      } else {
        setBookStyles([...bookStyles, savedStyle]);
      }

      setShowModal(false);
      setEditingStyle(null);
      setFormData({
        name: '',
        genre: '',
        themes: '',
        tone: 'Balanced',
        pacing: 'Moderate',
        chapterLength: 'Medium',
        sentenceComplexity: 'Balanced',
        descriptiveLevel: 5,
        dialogueVsNarrative: 5,
        pointOfView: 'Third-Person Limited',
        tense: 'Past',
      });
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

  // 📌 Add function to set a book style as default
  const handleSetDefault = async (id) => {
    try {
      const response = await fetch('/api/user/bookstyle', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id, defaultStyle: true }),
      });

      if (!response.ok) throw new Error('Failed to set default book style');

      const updatedStyle = await response.json();

      // Update UI to mark the selected style as default and unset others
      setBookStyles((prev) =>
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
      <h2 className="text-xl font-semibold mb-4">Manage Your Book Styles</h2>

      {/* 🔹 Create New Book Style Button */}
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
        <ul className="list-disc pl-5 mt-4">
          {bookStyles.map((style) => (
            <li
              key={style._id}
              className="mb-2 flex justify-between items-center"
            >
              <div>
                <span className="font-bold">
                  {style.defaultStyle ? '⭐' : ''} {style.name}
                </span>
                - {style.genre}
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

              {/* 🔹 FIX: Add Tone Dropdown */}
              <label className="block mb-2">
                Tone:
                <select
                  name="tone"
                  value={formData.tone}
                  onChange={handleInputChange}
                  className="w-full border p-2 rounded"
                >
                  <option value="Lighthearted">Lighthearted</option>
                  <option value="Gritty">Gritty</option>
                  <option value="Balanced">Balanced</option>
                </select>
              </label>

              <div className="flex justify-end mt-4">
                <button
                  type="button"
                  onClick={() => {
                    setShowModal(false);
                    setEditingStyle(null);
                  }}
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
