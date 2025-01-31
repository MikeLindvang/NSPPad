'use client';

import ProjectSidebar from '../../components/ProjectSidebar';
import EditorComponent from '../../components/EditorComponent';
import AnalysisSidebar from '../../components/AnalysisSidebar';
import DepthScore from '../../components/DepthScore';
import ProjectTitle from '../../components/ProjectTitle';
import { useProject } from '../../context/ProjectContext';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faBars, faChartBar } from '@fortawesome/free-solid-svg-icons';

export default function ProjectPage() {
  const router = useRouter();
  const { project, updateProject, deleteProject, loading, error, selectedDoc } =
    useProject();
  const [isProjectSidebarVisible, setProjectSidebarVisible] = useState(true);
  const [isAnalysisSidebarVisible, setAnalysisSidebarVisible] = useState(true);

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

  return (
    <div className="flex flex-col h-screen">
      {/* 🔹 Navbar (Fixed at Top) */}
      <header className="bg-slate-100 w-full shadow-md py-4 px-6 border-b border-gray-300 flex justify-between items-center">
        <ProjectTitle
          title={project.title}
          onSave={updateProject}
          onDelete={async () => {
            try {
              await deleteProject(project._id);
              router.push('/dashboard');
            } catch (error) {
              console.error('Error deleting project:', error);
            }
          }}
        />
        {/* 🔹 Toggle Buttons */}
        <div className="flex gap-4">
          <button
            onClick={() => setProjectSidebarVisible(!isProjectSidebarVisible)}
            className="text-gray-600 hover:text-black"
            title="Toggle Project Sidebar"
          >
            <FontAwesomeIcon icon={faBars} size="lg" />
          </button>
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
              <div className="flex-1 overflow-auto p-5 ">
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
