'use client';

import ProjectSidebar from '../../components/ProjectSidebar';
import EditorComponent from '../../components/EditorComponent';
import AnalysisSidebar from '../../components/AnalysisSidebar';
import DepthScore from '../../components/DepthScore';
import { useProject } from '../../context/ProjectContext';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import {
  faBars,
  faChartBar,
  faEdit,
  faTrash,
} from '@fortawesome/free-solid-svg-icons';

export default function ProjectPage() {
  const router = useRouter();
  const { project, updateProject, deleteProject, loading, error, selectedDoc } =
    useProject();
  const [isProjectSidebarVisible, setProjectSidebarVisible] = useState(true);
  const [isAnalysisSidebarVisible, setAnalysisSidebarVisible] = useState(true);
  const [isEditing, setIsEditing] = useState(false);
  const [newTitle, setNewTitle] = useState(project?.title || '');

  if (loading) {
    return (
      <p className="text-center text-gray-600 mt-10">Loading project...</p>
    );
  }

  if (error) {
    return (
      <p className="text-center text-red-500 mt-10">
        Failed to load project: {error}
      </p>
    );
  }

  if (!project) {
    return <p className="text-center text-gray-600 mt-10">No project found.</p>;
  }

  const handleTitleEdit = () => {
    if (newTitle.trim() && newTitle !== project.title) {
      updateProject(newTitle);
    }
    setIsEditing(false);
  };

  return (
    <div className="flex flex-col h-screen">
      {/* 🔹 Navbar (Fixed at Top) */}
      <header className="bg-slate-100 w-full shadow-md py-4 px-6 border-b border-gray-300 flex justify-between items-center">
        {/* 🔹 Editable Project Title + Delete Icon */}
        <div className="flex items-center gap-3">
          {isEditing ? (
            <input
              type="text"
              value={newTitle}
              onChange={(e) => setNewTitle(e.target.value)}
              onBlur={handleTitleEdit}
              onKeyDown={(e) => e.key === 'Enter' && handleTitleEdit()}
              className="bg-gray-200 text-gray-900 border border-gray-400 rounded px-2 py-1"
              autoFocus
            />
          ) : (
            <h2 className="text-xl font-bold flex items-center gap-2 cursor-pointer">
              {project.title}
              <FontAwesomeIcon
                icon={faEdit}
                className="text-gray-500 hover:text-gray-800 cursor-pointer"
                onClick={() => setIsEditing(true)}
                title="Edit Project Title"
              />
            </h2>
          )}

          {/* 🔥 Trash Icon for Delete Project */}
          <button
            onClick={async () => {
              try {
                await deleteProject(project._id);
                router.push('/dashboard');
              } catch (error) {
                console.error('Error deleting project:', error);
              }
            }}
            className="text-red-500 hover:text-red-700 transition"
            title="Delete Project"
          >
            <FontAwesomeIcon icon={faTrash} />
          </button>
        </div>

        {/* 🔹 Sidebar Toggles */}
        <div className="flex gap-4">
          <button
            onClick={() => setAnalysisSidebarVisible(!isAnalysisSidebarVisible)}
            className="text-gray-600 hover:text-black"
            title="Toggle Analysis Sidebar"
          >
            <FontAwesomeIcon icon={faChartBar} size="lg" />
          </button>
        </div>
      </header>

      {/* 🔹 Main Content (Takes up remaining space) */}
      <div className="flex flex-1 overflow-hidden">
        {/* 🔹 Project Sidebar (Toggleable) */}
        {isProjectSidebarVisible && <ProjectSidebar />}

        {/* 🔹 Editor + DepthScore Wrapper (Expands between sidebars) */}
        <div className="flex-1 flex flex-col overflow-hidden">
          {selectedDoc ? (
            <>
              {/* ✅ Editor fills remaining space between header & DepthScore */}
              <div className="flex-1 overflow-auto p-5">
                <EditorComponent selectedDoc={selectedDoc} />
              </div>
            </>
          ) : (
            <p className="text-gray-500 p-5">
              No documents available. Please add one.
            </p>
          )}
        </div>

        {/* 🔹 Analysis Sidebar (Toggleable) */}
        {isAnalysisSidebarVisible && <AnalysisSidebar />}
      </div>
    </div>
  );
}
