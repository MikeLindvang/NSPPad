'use client';

import ProjectSidebar from '../../components/ProjectSidebar';
import EditorComponent from '../../components/EditorComponent';
import AnalysisSidebar from '../../components/AnalysisSidebar';
import ProjectTitle from '../../components/ProjectTitle';
import { useProject } from '../../context/ProjectContext';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faChartBar } from '@fortawesome/free-solid-svg-icons';
import { useState } from 'react';
import { useRouter } from 'next/navigation';

export default function ProjectPage() {
  const router = useRouter();
  const { project, updateProject, deleteProject, loading, error, selectedDoc } =
    useProject();
  const [isSidebarVisible, setSidebarVisible] = useState(false);

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
    <div className="flex relative">
      {/* Sidebar */}
      <ProjectSidebar />

      {/* Main Content */}
      <div
        className={`flex-1 transition-all duration-300 ${
          isSidebarVisible ? 'pr-[24rem]' : ''
        }`}
      >
        <main className="p-5 bg-white shadow-lg w-full">
          <div className="flex justify-between items-center mb-4">
            {/* Project Title */}
            <ProjectTitle
              title={project.title}
              onSave={updateProject} // Update title
              onDelete={async () => {
                // Handle project deletion and redirect to dashboard
                try {
                  await deleteProject(project._id);
                  router.push('/dashboard');
                } catch (error) {
                  console.error('Error deleting project:', error);
                }
              }}
            />
          </div>

          {selectedDoc ? (
            <EditorComponent selectedDoc={selectedDoc} />
          ) : (
            <p className="text-gray-500">
              No documents available. Please add one.
            </p>
          )}
        </main>
      </div>

      {/* Floating Toggle Icon */}
      <div
        className="fixed bottom-20 right-10 cursor-pointer text-gray-600 hover:text-black z-50"
        onClick={() => setSidebarVisible(!isSidebarVisible)}
      >
        <FontAwesomeIcon icon={faChartBar} size="2x" />
      </div>

      {/* Analysis Sidebar */}
      <div
        className={`fixed top-0 right-0 h-full bg-slate-200 shadow-lg border-l border-gray-300 transition-transform duration-300 ${
          isSidebarVisible ? 'translate-x-0' : 'translate-x-full'
        }`}
        style={{ width: '24rem' }}
      >
        <AnalysisSidebar text={selectedDoc?.content || ''} />
      </div>
    </div>
  );
}
