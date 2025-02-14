'use client';

import { useState, useEffect } from 'react';
import { useProject } from '../context/ProjectContext';
import { useUserStyles } from '../context/UserStylesContext';

export default function ProjectSettings() {
  const { project, updateProject } = useProject();
  const { authorStyles, bookStyles } = useUserStyles();
  const [selectedAuthorStyle, setSelectedAuthorStyle] = useState(
    project?.authorStyleId || 'default'
  );
  const [selectedBookStyle, setSelectedBookStyle] = useState(
    project?.bookStyleId || 'default'
  );

  useEffect(() => {
    if (project) {
      setSelectedAuthorStyle(project.authorStyleId || 'default');
      setSelectedBookStyle(project.bookStyleId || 'default');
    }
  }, [project]);

  const handleStyleUpdate = async () => {
    const updatedProject = {
      ...project,
      authorStyleId:
        selectedAuthorStyle === 'default' ? null : selectedAuthorStyle,
      bookStyleId: selectedBookStyle === 'default' ? null : selectedBookStyle,
    };

    await updateProject(updatedProject);
  };

  return (
    <div className="p-5 bg-white shadow-md rounded-lg">
      <h3 className="text-lg font-semibold mb-2">Project Style Settings</h3>

      {/* 🔹 Author Style Selection */}
      <label className="block mb-2">
        <span className="text-gray-700">Author Style:</span>
        <select
          value={selectedAuthorStyle}
          onChange={(e) => setSelectedAuthorStyle(e.target.value)}
          className="w-full border p-2 rounded"
        >
          <option value="default">Use Default</option>
          {authorStyles.map((style) => (
            <option key={style._id} value={style._id}>
              {style.name} {style.defaultStyle ? '⭐' : ''}
            </option>
          ))}
        </select>
      </label>

      {/* 🔹 Book Style Selection */}
      <label className="block mb-4">
        <span className="text-gray-700">Book Style:</span>
        <select
          value={selectedBookStyle}
          onChange={(e) => setSelectedBookStyle(e.target.value)}
          className="w-full border p-2 rounded"
        >
          <option value="default">Use Default</option>
          {bookStyles.map((style) => (
            <option key={style._id} value={style._id}>
              {style.name} {style.defaultStyle ? '📖⭐' : ''}
            </option>
          ))}
        </select>
      </label>

      {/* 🔹 Save Button */}
      <button
        onClick={handleStyleUpdate}
        className="px-4 py-2 bg-blue-500 text-white rounded-md hover:bg-blue-600"
      >
        Save Changes
      </button>
    </div>
  );
}
