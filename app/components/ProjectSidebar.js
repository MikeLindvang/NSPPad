'use client';

import { useContext, useState } from 'react';
import { ProjectContext } from '../context/ProjectContext';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import {
  faPlus,
  faArrowUp,
  faArrowDown,
  faTrash,
  faEdit,
} from '@fortawesome/free-solid-svg-icons';

export default function ProjectSidebar() {
  const {
    project,
    selectedDoc,
    setSelectedDoc,
    addDocument,
    updateDocument,
    deleteDocument,
    reorderDocuments,
  } = useContext(ProjectContext);

  const [editingDocId, setEditingDocId] = useState(null);
  const [newTitle, setNewTitle] = useState('');
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [docToDelete, setDocToDelete] = useState(null);

  // Start editing document title
  const startEditing = (doc) => {
    setEditingDocId(doc._id);
    setNewTitle(doc.title);
  };

  // Save document title changes
  const handleSaveTitle = async (docId) => {
    if (!newTitle.trim()) return;
    await updateDocument(docId, { title: newTitle });
    setEditingDocId(null);
  };

  // Add a new document
  const handleAddDocument = async () => {
    const newDoc = await addDocument();
    setSelectedDoc(newDoc);
  };

  // Open confirmation modal for document deletion
  const confirmDeleteDocument = (docId) => {
    setDocToDelete(docId);
    setShowConfirmModal(true);
  };

  // Delete the document after confirmation
  const handleDeleteDocument = async () => {
    if (!docToDelete) return;

    await deleteDocument(docToDelete);

    // Set the first document as the selected one after deletion
    if (project.documents.length > 1) {
      const remainingDocs = project.documents.filter(
        (doc) => doc._id !== docToDelete
      );
      setSelectedDoc(remainingDocs[0]);
    } else {
      setSelectedDoc(null);
    }

    // Close modal
    setShowConfirmModal(false);
    setDocToDelete(null);
  };

  return (
    <aside className="w-80 bg-gray-200 p-4 border-r border-gray-300 flex flex-col shadow-lg h-full">
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-xl font-bold">Documents</h2>
        <button
          onClick={handleAddDocument}
          className="text-blue-500 hover:text-blue-700"
          title="Add New Document"
        >
          <FontAwesomeIcon icon={faPlus} />
        </button>
      </div>

      {/* Document List with Proper Scrolling */}
      <ul className="flex-1 overflow-auto space-y-2 scrollbar-hide">
        {project?.documents.length > 0 ? (
          project.documents.map((doc, index) => (
            <li
              key={doc._id}
              className={`p-2 shadow rounded flex items-center justify-between transition ${
                selectedDoc?._id === doc._id
                  ? 'bg-gray-300'
                  : 'hover:bg-gray-100'
              }`}
              onClick={() => setSelectedDoc(doc)}
            >
              {editingDocId === doc._id ? (
                <input
                  type="text"
                  value={newTitle}
                  onChange={(e) => setNewTitle(e.target.value)}
                  onBlur={() => handleSaveTitle(doc._id)}
                  onKeyDown={(e) =>
                    e.key === 'Enter' && handleSaveTitle(doc._id)
                  }
                  className="border border-gray-300 focus:outline-none p-1 w-full rounded"
                  autoFocus
                />
              ) : (
                <span className="w-full truncate">{doc.title}</span>
              )}

              <div className="flex items-center space-x-2">
                <FontAwesomeIcon
                  icon={faEdit}
                  onClick={(e) => {
                    e.stopPropagation();
                    startEditing(doc);
                  }}
                  className="cursor-pointer text-gray-500 hover:text-gray-700"
                  title="Edit Title"
                />
                {index > 0 && (
                  <FontAwesomeIcon
                    icon={faArrowUp}
                    onClick={(e) => {
                      e.stopPropagation();
                      reorderDocuments(index, index - 1);
                    }}
                    className="cursor-pointer text-gray-500 hover:text-gray-700"
                    title="Move Up"
                  />
                )}
                {index < project.documents.length - 1 && (
                  <FontAwesomeIcon
                    icon={faArrowDown}
                    onClick={(e) => {
                      e.stopPropagation();
                      reorderDocuments(index, index + 1);
                    }}
                    className="cursor-pointer text-gray-500 hover:text-gray-700"
                    title="Move Down"
                  />
                )}
                <FontAwesomeIcon
                  icon={faTrash}
                  onClick={(e) => {
                    e.stopPropagation();
                    confirmDeleteDocument(doc._id);
                  }}
                  className="cursor-pointer text-red-500 hover:text-red-700"
                  title="Delete Document"
                />
              </div>
            </li>
          ))
        ) : (
          <p className="text-gray-500">No documents available.</p>
        )}
      </ul>

      {/* Confirmation Modal */}
      {showConfirmModal && (
        <div className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-50 z-50">
          <div className="bg-white p-6 rounded shadow-md w-96">
            <h2 className="text-lg font-bold mb-4">Confirm Delete</h2>
            <p className="text-gray-700 mb-4">
              Are you sure you want to delete this document? This action cannot
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
                onClick={handleDeleteDocument}
                className="bg-red-500 text-white px-4 py-2 rounded hover:bg-red-600"
              >
                Delete
              </button>
            </div>
          </div>
        </div>
      )}
    </aside>
  );
}
