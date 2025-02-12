'use client';

import { useState } from 'react';
import { useProject } from '../context/ProjectContext'; // ✅ Corrected import path
import { useRouter } from 'next/navigation';

export default function ProjectTitle() {
  const { project, updateProject, deleteProject } = useProject(); // ✅ Access project context
  const [isEditing, setIsEditing] = useState(false);
  const [newTitle, setNewTitle] = useState(
    project?.title || 'Untitled Project'
  );
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const router = useRouter();

  const handleSave = async () => {
    if (newTitle.trim() && newTitle !== project.title) {
      await updateProject({ title: newTitle });
    }
    setIsEditing(false);
  };

  const handleDelete = async () => {
    setShowConfirmModal(false);
    try {
      await deleteProject();
      router.push(`/dashboard/`);
    } catch (error) {
      console.error('Error deleting project:', error);
    }
  };

  return (
    <div className="flex items-center justify-between">
      {/* Title Display/Edit */}
      {isEditing ? (
        <input
          type="text"
          value={newTitle}
          onChange={(e) => setNewTitle(e.target.value)}
          onBlur={handleSave}
          onKeyDown={(e) => {
            if (e.key === 'Enter') handleSave();
          }}
          className="text-2xl font-bold border border-gray-300 rounded px-2 py-1 w-full"
          autoFocus
        />
      ) : (
        <h1
          className="text-2xl font-bold cursor-pointer"
          onClick={() => setIsEditing(true)}
        >
          {project?.title || 'Untitled Project'}
        </h1>
      )}

      {/* Delete Button */}
      <button
        onClick={() => setShowConfirmModal(true)}
        className="text-red-500 hover:text-red-700 text-sm px-2 py-1 border border-red-500 rounded"
      >
        Delete
      </button>

      {/* Confirmation Modal */}
      {showConfirmModal && (
        <div className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-50 z-50">
          <div className="bg-white p-6 rounded shadow-md w-96">
            <h2 className="text-lg font-bold mb-4">Confirm Delete</h2>
            <p className="text-gray-700 mb-4">
              Are you sure you want to delete this project? This action cannot
              be undone.
            </p>
            <div className="flex justify-end space-x-4">
              <button
                onClick={() => setShowConfirmModal(false)}
                className="bg-gray-300 text-gray-700 px-4 py-2 rounded hover:bg-gray-400"
              >
                Cancel
              </button>
              <button
                onClick={handleDelete}
                className="bg-red-500 text-white px-4 py-2 rounded hover:bg-red-600"
              >
                Delete
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
