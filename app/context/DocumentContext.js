'use client';
import { createContext, useContext, useState, useEffect } from 'react';
import { useProject } from './ProjectContext';

const DocumentContext = createContext();

export const DocumentProvider = ({ children }) => {
  const { project, setProject } = useProject();
  const [selectedDoc, setSelectedDoc] = useState(null);

  // Auto-select first document when project changes
  useEffect(() => {
    if (project?.documents?.length > 0) {
      setSelectedDoc((prev) => prev || project.documents[0]);
    } else {
      setSelectedDoc(null);
    }
  }, [project]);

  // 🔹 Add a new document and auto-select it
  const addDocument = async (title = 'Untitled Document') => {
    if (!project?._id) return;

    try {
      const res = await fetch(`/api/projects/${project._id}/documents`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ title, content: '' }),
      });

      const newDoc = await res.json();
      if (!res.ok) throw new Error(newDoc.error);

      const updatedDocs = [...project.documents, newDoc];
      setProject((prev) => ({ ...prev, documents: updatedDocs }));
      setSelectedDoc(newDoc);
    } catch (err) {
      console.error('❌ Error adding document:', err);
    }
  };

  // 🔹 Delete a document and auto-select fallback
  const deleteDocument = async (docId) => {
    if (!project?._id) return;

    try {
      await fetch(`/api/projects/${project._id}/documents/${docId}`, {
        method: 'DELETE',
      });

      const updatedDocs = project.documents.filter((doc) => doc._id !== docId);
      setProject((prev) => ({ ...prev, documents: updatedDocs }));
      setSelectedDoc(updatedDocs[0] || null);
    } catch (err) {
      console.error('❌ Error deleting document:', err);
    }
  };

  // 🔹 Update any document's fields
  const updateDocument = async (docId, updatedFields) => {
    if (!project || !docId) return;

    const updatedDocs = project.documents.map((doc) =>
      doc._id === docId ? { ...doc, ...updatedFields } : doc
    );

    setProject((prev) => ({ ...prev, documents: updatedDocs }));

    if (selectedDoc?._id === docId) {
      setSelectedDoc((prev) => ({ ...prev, ...updatedFields }));
    }

    try {
      const res = await fetch(
        `/api/projects/${project._id}/documents/${docId}`,
        {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(updatedFields),
        }
      );

      if (!res.ok) throw new Error('Failed to update document');
    } catch (err) {
      console.error('❌ Error updating document:', err);
    }
  };

  // 🔹 Update only the content of the selected document
  const updateSelectedDocContent = async (newContent) => {
    if (!selectedDoc || !project?._id) return;

    setSelectedDoc((prev) => ({ ...prev, content: newContent }));

    const updatedDocs = project.documents.map((doc) =>
      doc._id === selectedDoc._id ? { ...doc, content: newContent } : doc
    );
    setProject((prev) => ({ ...prev, documents: updatedDocs }));

    try {
      await fetch(`/api/projects/${project._id}/documents/${selectedDoc._id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ content: newContent }),
      });
    } catch (err) {
      console.error('❌ Error saving content:', err);
    }
  };

  return (
    <DocumentContext.Provider
      value={{
        selectedDoc,
        setSelectedDoc,
        addDocument,
        deleteDocument,
        updateDocument,
        updateSelectedDocContent,
      }}
    >
      {children}
    </DocumentContext.Provider>
  );
};

export const useDocument = () => {
  const context = useContext(DocumentContext);
  if (!context) {
    throw new Error('useDocument must be used within a DocumentProvider');
  }
  return context;
};
