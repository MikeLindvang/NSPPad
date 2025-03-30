// ProjectContext.js - Manages project-level state
'use client';
import { createContext, useContext, useState, useEffect } from 'react';

const ProjectContext = createContext();

export const ProjectProvider = ({ children, initialProject, projectId }) => {
  const [project, setProject] = useState(initialProject || null);
  const [loading, setLoading] = useState(!initialProject);
  const [error, setError] = useState(null);

  // Fetch project data from the backend
  useEffect(() => {
    if (initialProject || !projectId) return;

    async function fetchProject() {
      setLoading(true);
      setError(null);

      try {
        const response = await fetch(`/api/projects/${projectId}`);
        if (!response.ok)
          throw new Error(
            `Failed to fetch project. Status: ${response.status}`
          );

        const data = await response.json();
        console.log('✅ Fetched Project:', data); // 🔹 Debugging log

        if (!data || !data.documents) {
          console.warn(
            '⚠️ No documents found in the project. Setting empty project.'
          );
          setProject({ ...data, documents: [] });
        } else {
          setProject(data);
        }
      } catch (err) {
        console.error('❌ Error fetching project:', err);
        setError('Failed to load project.');
      } finally {
        setLoading(false);
      }
    }

    fetchProject();
  }, [projectId, initialProject]);

  // Update project details
  const updateProject = async (updatedFields) => {
    if (!project) return null;
    try {
      // PATCH instead of PUT if you're only sending partial fields
      const response = await fetch(`/api/projects/${project._id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updatedFields),
      });

      if (!response.ok) throw new Error('Failed to update project');

      // ✅ Refetch fresh project with latest data
      const refreshed = await fetch(`/api/projects/${project._id}`);
      const freshData = await refreshed.json();
      setProject(freshData);

      console.log('✅ Project updated and refreshed successfully');
      return freshData;
    } catch (error) {
      console.error('❌ Error updating project:', error);
      return null;
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

      if (!response.ok) throw new Error('Failed to save project');
      console.log('✅ Project saved successfully');
    } catch (error) {
      console.error('❌ Error saving project:', error);
    }
  };

  // Delete the project
  const deleteProject = async () => {
    if (!projectId) return;
    try {
      const response = await fetch(`/api/projects/${projectId}`, {
        method: 'DELETE',
      });

      if (!response.ok) throw new Error('Failed to delete project');
      console.log('✅ Project deleted successfully');
      return true;
    } catch (error) {
      console.error('❌ Error deleting project:', error);
      return false;
    }
  };

  //Reorder documents
  const reorderDocuments = async (oldIndex, newIndex) => {
    if (!project || !project._id) return;

    const updatedDocuments = [...project.documents];
    const [movedDoc] = updatedDocuments.splice(oldIndex, 1); // Remove from old position
    updatedDocuments.splice(newIndex, 0, movedDoc); // Insert at new position

    setProject((prevProject) => ({
      ...prevProject,
      documents: updatedDocuments,
    }));

    try {
      const response = await fetch(
        `/api/projects/${project._id}/reorder`, // ✅ Updated to correct API route
        {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            documents: updatedDocuments.map((doc) => doc._id),
          }), // Send only IDs
        }
      );

      if (!response.ok) {
        throw new Error('Failed to update document order');
      }

      console.log('✅ Document order updated successfully');
    } catch (error) {
      console.error('❌ Error updating document order:', error);
    }
  };

  return (
    <ProjectContext.Provider
      value={{
        project,
        setProject,
        updateProject,
        deleteProject,
        saveProject,
        loading,
        error,
        reorderDocuments,
      }}
    >
      {children}
    </ProjectContext.Provider>
  );
};

export const useProject = () => {
  const context = useContext(ProjectContext);
  if (!context) {
    throw new Error('useProject must be used within a ProjectProvider');
  }
  return context;
};

export { ProjectContext };
