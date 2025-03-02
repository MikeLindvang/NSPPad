'use client';

import ProjectSidebar from '../../components/ProjectSidebar';
import EditorComponent from '../../components/EditorComponent';
import AnalysisSidebar from '../../components/AnalysisSidebar';
import { useProject } from '../../context/ProjectContext';
import { useDocument } from '../../context/DocumentContext';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import {
  faChartBar,
  faEdit,
  faTrash,
  faFileWord,
} from '@fortawesome/free-solid-svg-icons';
import { saveAs } from 'file-saver';
import { Document, Packer, Paragraph, TextRun, HeadingLevel } from 'docx';
import { convert } from 'html-to-text'; // ✅ Converts HTML to text
import { faCog } from '@fortawesome/free-solid-svg-icons';
import ProjectSettingsModal from '../../components/ProjectSettingsModal'; // ✅ Import new modal component

export default function ProjectPage() {
  const router = useRouter();
  const { project, updateProject, deleteProject, loading, error } =
    useProject();
  const { selectedDoc } = useDocument();

  const [isProjectSidebarVisible, setProjectSidebarVisible] = useState(true);
  const [isAnalysisSidebarVisible, setAnalysisSidebarVisible] = useState(true);
  const [isEditing, setIsEditing] = useState(false);
  const [newTitle, setNewTitle] = useState(project?.title || '');

  const [showSettingsModal, setShowSettingsModal] = useState(false);

  if (loading)
    return (
      <p className="text-center text-gray-600 mt-10">Loading project...</p>
    );
  if (error)
    return (
      <p className="text-center text-red-500 mt-10">
        Failed to load project: {error}
      </p>
    );
  if (!project)
    return <p className="text-center text-gray-600 mt-10">No project found.</p>;

  const handleTitleEdit = () => {
    if (newTitle.trim() && newTitle !== project.title) {
      updateProject({ title: newTitle });
    }
    setIsEditing(false);
  };

  // ✅ Export Function for DOCX
  const handleExportToDocx = () => {
    if (!project || !project.documents || project.documents.length === 0)
      return;

    const docSections = project.documents.map((doc, index) => {
      // ✅ Convert HTML to text while preserving inline formatting (bold, italics)
      const cleanedContent = convert(doc.content, {
        wordwrap: false, // Prevent line breaks from wrapping
        selectors: [
          {
            selector: 'p',
            options: { leadingLineBreaks: 1, trailingLineBreaks: 1 },
          },
          {
            selector: 'strong',
            format: 'inline',
            options: { uppercase: false },
          },
          { selector: 'b', format: 'inline', options: { uppercase: false } },
          { selector: 'em', format: 'inline', options: { italic: true } },
          { selector: 'i', format: 'inline', options: { italic: true } },
          {
            selector: 'h1',
            format: 'block',
            options: { leadingLineBreaks: 2, trailingLineBreaks: 2 },
          },
          {
            selector: 'h2',
            format: 'block',
            options: { leadingLineBreaks: 2, trailingLineBreaks: 2 },
          },
        ],
      });

      // ✅ Split into paragraphs and format correctly
      const paragraphs = cleanedContent.split('\n').map((line) => {
        if (line.trim() === '') return new Paragraph(''); // Preserve line breaks
        return new Paragraph({
          children: [new TextRun(line.trim())],
        });
      });

      return [
        // ✅ Add Document Title as Heading 1
        new Paragraph({
          text: doc.title,
          heading: HeadingLevel.HEADING_1,
        }),

        ...paragraphs,

        // ✅ Page break before the next document
        ...(index < project.documents.length - 1
          ? [new Paragraph({ pageBreakBefore: true })]
          : []),
      ];
    });

    // ✅ Flatten the sections array
    const doc = new Document({
      sections: [{ children: docSections.flat() }],
    });

    // ✅ Convert and save the document
    Packer.toBlob(doc).then((blob) => {
      saveAs(blob, `${project.title || 'Untitled Project'}.docx`);
    });
  };

  return (
    <div className="flex flex-col h-screen">
      {/* 🔹 Navbar (Fixed at Top) */}
      <header className="bg-slate-100 dark:bg-background-accent dark:text-text-dark w-full shadow-md py-4 px-6 border-b border-gray-300 flex justify-between items-center">
        {/* 🔹 Editable Project Title + Edit & Delete Icons */}
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
                className="text-gray-500 hover:text-gray-800 dark:text-text-dark dark:hover:text-gray-400 cursor-pointer"
                onClick={() => setIsEditing(true)}
                title="Edit Project Title"
              />
            </h2>
          )}

          {/* 🔥 Export Button */}
          <button
            onClick={handleExportToDocx}
            className="text-blue-500 hover:text-blue-700 transition"
            title="Export Project to DOCX"
          >
            <FontAwesomeIcon icon={faFileWord} size="lg" />
          </button>

          {/* 🔥 Delete Button */}
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
          {/* 🔥 Settings Button */}
          <button
            onClick={() => setShowSettingsModal(true)}
            className="text-gray-600 hover:text-gray-900 dark:text-text-dark dark:hover:text-gray-400  transition"
            title="Project Settings"
          >
            <FontAwesomeIcon icon={faCog} size="lg" />
          </button>
          <button
            onClick={() => setAnalysisSidebarVisible(!isAnalysisSidebarVisible)}
            className="text-gray-600 hover:text-black dark:text-text-dark dark:hover:text-gray-400"
            title="Toggle Analysis Sidebar"
          >
            <FontAwesomeIcon icon={faChartBar} size="lg" />
          </button>
        </div>
      </header>

      {/* 🔥 Project Settings Modal */}
      {showSettingsModal && (
        <ProjectSettingsModal onClose={() => setShowSettingsModal(false)} />
      )}

      {/* 🔹 Main Content (Takes up remaining space) */}
      <div className="flex flex-1 overflow-hidden scrollbar-hide">
        {isProjectSidebarVisible && <ProjectSidebar />}
        <div className="flex-1 flex flex-col overflow-hidden scrollbar-hide">
          {selectedDoc ? (
            <div className="flex-1 overflow-auto p-5 scrollbar-hide min-w-80">
              <EditorComponent selectedDoc={selectedDoc} />
            </div>
          ) : (
            <p className="text-gray-500 p-5">
              No documents available. Please add one.
            </p>
          )}
        </div>
        {isAnalysisSidebarVisible && <AnalysisSidebar />}
      </div>
    </div>
  );
}
