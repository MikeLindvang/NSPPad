'use client';
import { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import ProjectSidebar from '../../components/ProjectSidebar';
import EditorComponent from '../../components/EditorComponent';

export default function Project() {
  const params = useParams();
  const [project, setProject] = useState(null);
  const [selectedDoc, setSelectedDoc] = useState(null);
  const [lastSaved, setLastSaved] = useState(null);
  const [editorKey, setEditorKey] = useState(0);

  const handleDocumentChange = (doc) => {
    setSelectedDoc(doc);
    setEditorKey((prevKey) => prevKey + 1); // Force re-render of EditorComponent
  };

  useEffect(() => {
    async function fetchProject() {
      try {
        const res = await fetch(`/api/projects/${params.id}`);
        if (!res.ok) throw new Error('Failed to fetch project');

        const data = await res.json();
        if (!data.documents || data.documents.length === 0) {
          const defaultDoc = {
            id: Date.now().toString(),
            title: 'Untitled Document',
            content: '',
          };
          const updatedProject = { ...data, documents: [defaultDoc] };
          await saveProject(updatedProject);
          setProject(updatedProject);
          setSelectedDoc(defaultDoc);
        } else {
          setProject(data);
          setSelectedDoc(data.documents[0]);
        }

        setLastSaved(new Date().toLocaleTimeString());
      } catch (error) {
        console.error('Error loading project:', error);
      }
    }

    fetchProject();
  }, [params.id]);

  const saveProject = async (updatedProject) => {
    if (!updatedProject) {
      console.warn('PAGE - No project provided to save.');
      return;
    }

    console.log('PAGE - Saving Project:', updatedProject);

    try {
      const response = await fetch(`/api/projects/${params.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updatedProject),
      });

      if (!response.ok) {
        throw new Error(
          `PAGE - Failed to save project. Status: ${response.status}`
        );
      }

      setProject(updatedProject);
      setLastSaved(new Date().toLocaleTimeString());

      console.log('PAGE - Project saved successfully');
    } catch (error) {
      console.error('PAGE - Error saving project:', error);
    }
  };

  if (!project)
    return (
      <p className="text-center text-gray-600 mt-10">Loading project...</p>
    );

  return (
    <div className="min-h-screen flex">
      <ProjectSidebar
        project={project}
        setProject={setProject}
        setSelectedDoc={setSelectedDoc}
        selectedDocId={selectedDoc?.id}
        saveProject={saveProject}
      />
      <main className="flex-1 p-5 bg-white shadow-lg">
        <div className="flex justify-between items-center mb-4">
          <h1 className="text-2xl font-bold">
            {project.title}
            <span className="text-sm text-gray-500 ml-4">
              {lastSaved ? `Last saved: ${lastSaved}` : 'Not saved yet'}
            </span>
          </h1>
        </div>
        {selectedDoc ? (
          <EditorComponent
            selectedDoc={selectedDoc}
            onSave={saveProject}
            setProject={setProject}
          />
        ) : (
          <p className="text-gray-500">
            No documents available. Please add one.
          </p>
        )}
      </main>
    </div>
  );
}
