// DocumentContext.js - Manages document selection and updates
'use client';
import { createContext, useContext, useState, useEffect } from 'react';
import { useProject } from './ProjectContext';

const DocumentContext = createContext();

export const DocumentProvider = ({ children }) => {
  const { project, setProject } = useProject();
  const [selectedDoc, setSelectedDoc] = useState(null);

  // ✅ Ensure `selectedDoc` is set when project loads
  useEffect(() => {
    if (project?.documents?.length > 0) {
      setSelectedDoc((prev) => prev || project.documents[0]); // Keep previous selection or select first document
      console.log('📄 Auto-selected document:', project.documents[0]);
    } else {
      setSelectedDoc(null); // No documents available
      console.warn('⚠️ No documents found in the project.');
    }
  }, [project]);

  const addDocument = async (title = 'Untitled Document') => {
    if (!project || !project._id) {
      console.error('ERROR: Project ID is missing or project is not loaded.');
      return;
    }
    try {
      const response = await fetch(`/api/projects/${project._id}/documents`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ title, content: '' }),
      });

      const responseData = await response.json();
      if (!response.ok) throw new Error(responseData.error);

      const updatedDocuments = [...project.documents, responseData];
      setProject((prev) => ({ ...prev, documents: updatedDocuments }));

      setSelectedDoc(responseData); // ✅ Auto-select newly created document
      console.log('✅ Document added and selected:', responseData);
    } catch (error) {
      console.error('❌ Error adding document:', error);
    }
  };

  const deleteDocument = async (docId) => {
    if (!project || !project._id) return;
    try {
      await fetch(`/api/projects/${project._id}/documents/${docId}`, {
        method: 'DELETE',
      });

      const updatedDocuments = project.documents.filter(
        (doc) => doc._id !== docId
      );
      setProject((prev) => ({ ...prev, documents: updatedDocuments }));

      // ✅ Select the next available document (or null if none left)
      if (updatedDocuments.length > 0) {
        setSelectedDoc(updatedDocuments[0]);
        console.log('📄 Switched to next document:', updatedDocuments[0]);
      } else {
        setSelectedDoc(null);
        console.warn('⚠️ No documents left, clearing selection.');
      }
    } catch (error) {
      console.error('❌ Error deleting document:', error);
    }
  };

  const updateDocument = async (docId, updatedFields) => {
    if (!project || !docId) return;

    const updatedDocuments = project.documents.map((doc) =>
      doc._id === docId ? { ...doc, ...updatedFields } : doc
    );

    setProject((prevProject) => ({
      ...prevProject,
      documents: updatedDocuments,
    }));

    if (selectedDoc?._id === docId) {
      setSelectedDoc((prev) => ({ ...prev, ...updatedFields })); // ✅ Ensure UI updates properly
    }

    try {
      const response = await fetch(
        `/api/projects/${project._id}/documents/${docId}`,
        {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(updatedFields),
        }
      );

      if (!response.ok) {
        throw new Error('Failed to update document');
      }

      console.log('✅ Document updated successfully:', updatedFields);
    } catch (error) {
      console.error('❌ Error updating document:', error);
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
