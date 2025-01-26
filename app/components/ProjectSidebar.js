import {
  faPlus,
  faArrowUp,
  faArrowDown,
  faTrash,
  faEdit,
} from '@fortawesome/free-solid-svg-icons';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { useState } from 'react';

export default function ProjectSidebar({
  project,
  setProject,
  setSelectedDoc,
  selectedDocId,
  saveProject,
}) {
  const [editingDocId, setEditingDocId] = useState(null);
  const [newTitle, setNewTitle] = useState('');

  // Move a document up or down
  const moveDocument = (index, direction) => {
    const newOrder = [...project.documents];
    [newOrder[index], newOrder[index + direction]] = [
      newOrder[index + direction],
      newOrder[index],
    ];

    const updatedProject = { ...project, documents: newOrder };
    setProject(updatedProject);
    saveProject(updatedProject);
  };

  // Start editing document title
  const startEditing = (doc) => {
    setEditingDocId(doc.id);
    setNewTitle(doc.title);
  };

  // Save document title changes
  const handleSaveTitle = async (docId) => {
    if (!newTitle.trim()) return;

    const updatedDocs = project.documents.map((doc) =>
      doc.id === docId ? { ...doc, title: newTitle } : doc
    );

    const updatedProject = { ...project, documents: updatedDocs };
    setProject(updatedProject);
    await saveProject(updatedProject);

    if (selectedDocId === docId) {
      setSelectedDoc((prevDoc) => ({ ...prevDoc, title: newTitle }));
    }

    setEditingDocId(null);
  };

  // Add a new document
  const handleAddNewDocument = async () => {
    const newDoc = {
      id: Date.now().toString(),
      title: 'New Document',
      content: '',
    };

    const updatedProject = {
      ...project,
      documents: [...project.documents, newDoc],
    };

    setProject(updatedProject);
    setSelectedDoc(newDoc);

    console.log('New Document Added:', newDoc);
    console.log('Updated Project:', updatedProject);

    // Pass the full project instead of a single document
    await saveProject(updatedProject);
  };

  // Delete document
  const handleDeleteDocument = async (docId) => {
    if (!confirm('Are you sure you want to delete this document?')) return;

    const updatedDocs = project.documents.filter((doc) => doc.id !== docId);
    const updatedProject = { ...project, documents: updatedDocs };

    setProject(updatedProject);
    await saveProject(updatedProject);

    // Set a new selected doc after deletion
    if (updatedDocs.length > 0) {
      setSelectedDoc(updatedDocs[0]);
    } else {
      setSelectedDoc(null);
    }
  };

  return (
    <aside className="w-80 bg-gray-200 p-4 border-r border-gray-300 h-screen flex flex-col">
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-xl font-bold">Project Documents</h2>
        <button
          onClick={handleAddNewDocument}
          className="text-blue-500 hover:text-blue-700"
          title="Add New Document"
        >
          <FontAwesomeIcon icon={faPlus} />
        </button>
      </div>
      <ul className="flex-1 overflow-y-auto space-y-2">
        {project?.documents && project.documents.length > 0 ? (
          project.documents.map((doc, index) => (
            <li
              key={doc.id}
              className={`p-2 shadow rounded flex items-center justify-between transition ${
                selectedDocId === doc.id ? 'bg-gray-300' : 'hover:bg-gray-100'
              }`}
              onClick={() => setSelectedDoc(doc)}
            >
              {editingDocId === doc.id ? (
                <input
                  type="text"
                  value={newTitle}
                  onChange={(e) => setNewTitle(e.target.value)}
                  onBlur={() => handleSaveTitle(doc.id)}
                  onKeyDown={(e) =>
                    e.key === 'Enter' && handleSaveTitle(doc.id)
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
                  title="Edit Document Title"
                />
                {index > 0 && (
                  <FontAwesomeIcon
                    icon={faArrowUp}
                    onClick={(e) => {
                      e.stopPropagation();
                      moveDocument(index, -1);
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
                      moveDocument(index, 1);
                    }}
                    className="cursor-pointer text-gray-500 hover:text-gray-700"
                    title="Move Down"
                  />
                )}
                <FontAwesomeIcon
                  icon={faTrash}
                  onClick={(e) => {
                    e.stopPropagation();
                    handleDeleteDocument(doc.id);
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
    </aside>
  );
}
