'use client';

import { createContext, useContext, useState, useEffect } from 'react';

// Create the ProjectContext
const ProjectContext = createContext();

// ProjectProvider to wrap your app or pages
export const ProjectProvider = ({ children, initialProject, projectId }) => {
  const [project, setProject] = useState(initialProject || null);
  const [selectedDoc, setSelectedDoc] = useState(
    initialProject?.documents?.[0] || null
  );
  const [loading, setLoading] = useState(!initialProject); // Set loading to true if no initialProject
  const [error, setError] = useState(null);

  // Fetch project data from the backend
  useEffect(() => {
    if (initialProject || !projectId) return; // Skip fetch if initialProject is provided or no projectId

    async function fetchProject() {
      setLoading(true);
      setError(null);

      console.log('PROJECTID: ', projectId);

      try {
        const response = await fetch(`/api/projects/${projectId}`);
        if (!response.ok) {
          throw new Error(
            `Failed to fetch project. Status: ${response.status}`
          );
        }

        const data = await response.json();
        setProject(data);
        setSelectedDoc(data.documents?.[0] || null); // Set the first document as selected
      } catch (err) {
        console.error('Error fetching project:', err);
        setError('Failed to load project.');
      } finally {
        setLoading(false);
      }
    }

    fetchProject();
  }, [projectId, initialProject]);

  //CREATE FUNCTIONS
  //addDocument function creates a new document inside the project.
  const addDocument = async (title = 'Untitled Document') => {
    if (!project || !project._id) {
      console.error('ERROR: Project ID is missing or project is not loaded.');
      return;
    }

    console.log(`✅ Adding document to project ID: ${project._id}`);

    try {
      // Step 1: Create the new document in the database
      const response = await fetch(`/api/projects/${project._id}/documents`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ title, content: '' }),
      });

      const responseData = await response.json();

      if (!response.ok) {
        console.error('Failed to add document:', responseData);
        throw new Error(`Failed to add document: ${responseData.error}`);
      }

      console.log('✅ Document added successfully:', responseData);

      // Step 2: Reload the project from the database
      const projectResponse = await fetch(`/api/projects/${project._id}`);
      if (!projectResponse.ok) {
        throw new Error(
          `Failed to reload project. Status: ${projectResponse.status}`
        );
      }

      const updatedProject = await projectResponse.json();
      setProject(updatedProject);

      // Step 3: Select the newly created document
      const newDoc = updatedProject.documents.find(
        (doc) => doc._id === responseData._id
      );
      if (newDoc) {
        setSelectedDoc(newDoc);
        console.log('✅ Selected new document:', newDoc);
      } else {
        console.warn(
          '⚠️ Newly created document not found in reloaded project.'
        );
      }
    } catch (error) {
      console.error('Error adding document:', error);
    }
  };

  //UPDATE FUNCTIONS
  //Handles in-memory updates

  const updateProject = async (updatedFields) => {
    if (!project) return;

    try {
      const updatedProject = { ...project, ...updatedFields };
      setProject(updatedProject);

      const response = await fetch(`/api/projects/${project._id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updatedProject),
      });

      if (!response.ok) {
        throw new Error('Failed to update project');
      }

      console.log('Project updated successfully');
    } catch (error) {
      console.error('Error updating project:', error);
    }
  };

  // Update a specific document in the project
  const updateDocument = async (docId, updatedFields) => {
    console.log('🔹 Updating document in memory:', docId, updatedFields);

    setProject((prevProject) => {
      if (!prevProject) return null;

      const updatedDocuments = prevProject.documents.map((doc) =>
        doc._id === docId ? { ...doc, ...updatedFields } : doc
      );

      return { ...prevProject, documents: updatedDocuments };
    });

    try {
      console.log('🔹 Sending update request to server...');
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

      console.log('✅ Document updated successfully');
    } catch (error) {
      console.error('❌ Error updating document:', error);
    }
  };

  // Save the current document to the database
  const saveDocument = async (docId) => {
    if (!project || !docId) return;

    const doc = project.documents.find((d) => d._id === docId);

    try {
      const response = await fetch(
        `/api/projects/${project._id}/documents/${docId}`,
        {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(doc),
        }
      );

      if (!response.ok) {
        throw new Error('Failed to save document');
      }

      console.log('Document saved successfully');
    } catch (error) {
      console.error('Error saving document:', error);
    }
  };

  // Reorder documents in the project
  const reorderDocuments = async (newOrder) => {
    if (!project) {
      console.error('❌ No project found.');
      return;
    }

    console.log('🔹 Reordering documents:', newOrder);

    // Update the UI immediately
    setProject((prevProject) => ({
      ...prevProject,
      documents: newOrder,
    }));

    try {
      console.log('🔹 Sending reorder request to server...');
      const response = await fetch(`/api/projects/${project._id}/reorder`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ documents: newOrder }),
      });

      if (!response.ok) {
        throw new Error('Failed to reorder documents');
      }

      console.log('✅ Documents reordered successfully');
    } catch (error) {
      console.error('❌ Error reordering documents:', error);
    }
  };

  // Save the entire project to the database
  const saveProject = async () => {
    if (!project) return;

    try {
      const response = await fetch(`/api/projects/${project._id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(project),
      });

      if (!response.ok) {
        throw new Error('Failed to save project');
      }

      console.log('Project saved successfully');
    } catch (error) {
      console.error('Error saving project:', error);
    }
  };

  //DELETE FUNCTIONS

  // Delete a document from the project
  const deleteDocument = async (docId) => {
    if (!project || !project._id) {
      console.error('ERROR: Project ID is missing or project is not loaded.');
      return;
    }

    console.log(
      `🗑️ Deleting document ID: ${docId} from project ID: ${project._id}`
    );

    try {
      // Step 1: Send request to delete the document
      const response = await fetch(
        `/api/projects/${project._id}/documents/${docId}`,
        {
          method: 'DELETE',
          headers: { 'Content-Type': 'application/json' },
        }
      );

      const responseData = await response.json();

      if (!response.ok) {
        console.error('❌ Failed to delete document:', responseData);
        throw new Error(`Failed to delete document: ${responseData.error}`);
      }

      console.log('✅ Document deleted successfully.');

      // Step 2: Reload the project from the database
      const projectResponse = await fetch(`/api/projects/${project._id}`);
      if (!projectResponse.ok) {
        throw new Error(
          `Failed to reload project. Status: ${projectResponse.status}`
        );
      }

      const updatedProject = await projectResponse.json();
      setProject(updatedProject);

      // Step 3: Select the next available document
      if (updatedProject.documents.length > 0) {
        setSelectedDoc(updatedProject.documents[0]);
        console.log('📄 Selected next document:', updatedProject.documents[0]);
      } else {
        setSelectedDoc(null);
        console.log('⚠️ No documents left, selection cleared.');
      }
    } catch (error) {
      console.error('❌ Error deleting document:', error);
    }
  };

  //Delete a project
  // Delete the project
  const deleteProject = async () => {
    if (!projectId) return;

    try {
      const response = await fetch(`/api/projects/${projectId}`, {
        method: 'DELETE',
      });

      if (!response.ok) {
        throw new Error('Failed to delete project');
      }

      console.log('Project deleted successfully');
      return true; // Return success so the caller can handle navigation or cleanup
    } catch (error) {
      console.error('Error deleting project:', error);
      return false; // Return failure so the caller can handle errors
    }
  };

  // Provide context values
  return (
    <ProjectContext.Provider
      value={{
        project,
        setProject,
        updateProject,
        deleteProject,
        selectedDoc,
        setSelectedDoc,
        addDocument,
        updateDocument,
        saveDocument,
        saveProject,
        deleteDocument,
        loading,
        error,
        reorderDocuments,
      }}
    >
      {children}
    </ProjectContext.Provider>
  );
};

// Custom hook to use the ProjectContext
export const useProject = () => {
  const context = useContext(ProjectContext);

  if (!context) {
    throw new Error('useProject must be used within a ProjectProvider');
  }

  return context;
};

// Explicitly export the ProjectContext for optional direct use
export { ProjectContext };
