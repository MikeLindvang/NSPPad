'use client';

import { useState, useEffect } from 'react';
import { useProject } from '../context/ProjectContext';
import { useDocument } from '../context/DocumentContext';
import { useRouter } from 'next/navigation';

import ProjectSidebar from './ProjectSidebar';
import EditorComponent from './EditorComponent';
import ProjectSettingsModal from './ProjectSettingsModal';

import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import {
  faEdit,
  faFileWord,
  faTrash,
  faCog,
  faMagicWandSparkles,
} from '@fortawesome/free-solid-svg-icons';
import { saveAs } from 'file-saver';
import { Document, Packer, Paragraph, TextRun, HeadingLevel } from 'docx';
import { convert } from 'html-to-text';

export default function NonfictionEditorPage({ project }) {
  const { updateProject, deleteProject } = useProject();
  const { selectedDoc, updateSelectedDocContent, setSelectedDoc } =
    useDocument();
  const router = useRouter();

  const [isEditing, setIsEditing] = useState(false);
  const [newTitle, setNewTitle] = useState(project?.title || '');
  const [showSettingsModal, setShowSettingsModal] = useState(false);
  const [generating, setGenerating] = useState(false);
  const [documents, setDocuments] = useState([]);

  useEffect(() => {
    if (project?.documents?.length > 0) {
      setDocuments(project.documents);
    }
  }, [project]);

  useEffect(() => {
    if (documents.length > 0 && !selectedDoc) {
      setSelectedDoc(documents[0]);
    }
  }, [project, selectedDoc]);

  const handleTitleEdit = () => {
    if (newTitle.trim() && newTitle !== project.title) {
      updateProject({ title: newTitle });
    }
    setIsEditing(false);
  };

  const handleExportToDocx = () => {
    if (!documents.length) return;

    const docSections = documents.map((doc, index) => {
      const cleanedContent = convert(doc.content || '', {
        wordwrap: false,
        selectors: [
          {
            selector: 'p',
            options: { leadingLineBreaks: 1, trailingLineBreaks: 1 },
          },
          { selector: 'strong', format: 'inline' },
          { selector: 'em', format: 'inline', options: { italic: true } },
          { selector: 'i', format: 'inline', options: { italic: true } },
          { selector: 'h1', format: 'block' },
          { selector: 'h2', format: 'block' },
        ],
      });

      const paragraphs = cleanedContent
        .split('\n')
        .map((line) =>
          line.trim() === ''
            ? new Paragraph('')
            : new Paragraph({ children: [new TextRun(line.trim())] })
        );

      return [
        new Paragraph({ text: doc.title, heading: HeadingLevel.HEADING_1 }),
        // ...(doc.outlineNotes
        //   ? [
        //       new Paragraph({
        //         text: `Outline Notes: ${doc.outlineNotes}`,
        //         heading: HeadingLevel.HEADING_2,
        //       }),
        //     ]
        //   : []),
        ...paragraphs,
        ...(index < project.documents.length - 1
          ? [new Paragraph({ pageBreakBefore: true })]
          : []),
      ];
    });

    const doc = new Document({ sections: [{ children: docSections.flat() }] });
    Packer.toBlob(doc).then((blob) => {
      saveAs(blob, `${project.title || 'Untitled Project'}.docx`);
    });
  };

  const handleGenerateAI = async () => {
    if (!selectedDoc) return;
    setGenerating(true);

    try {
      const res = await fetch('/api/nonfiction/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          projectId: project._id,
          documentId: selectedDoc._id,
        }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to generate text');

      updateSelectedDocContent(data.suggestion || '');
    } catch (err) {
      console.error('❌ Error generating AI content:', err);
      alert('Could not generate text. Try again.');
    } finally {
      setGenerating(false);
    }
  };

  return (
    <div className="flex flex-col h-screen">
      <header className="bg-slate-100 dark:bg-background-accent dark:text-text-dark w-full shadow-md py-4 px-6 border-b border-gray-300 flex justify-between items-center">
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

          <button
            onClick={handleExportToDocx}
            className="text-blue-500 hover:text-blue-700 transition"
            title="Export Project to DOCX"
          >
            <FontAwesomeIcon icon={faFileWord} size="lg" />
          </button>

          <button
            onClick={async () => {
              await deleteProject(project._id);
              router.push('/dashboard');
            }}
            className="text-red-500 hover:text-red-700 transition"
            title="Delete Project"
          >
            <FontAwesomeIcon icon={faTrash} />
          </button>

          <button
            onClick={handleGenerateAI}
            className="ml-4 bg-green-600 text-white px-4 py-1 rounded hover:bg-green-700"
            disabled={generating}
            title="Generate Full Chapter with AI"
          >
            <FontAwesomeIcon icon={faMagicWandSparkles} className="mr-2" />
            {generating ? 'Generating...' : 'AI Generate Chapter'}
          </button>
        </div>

        <button
          onClick={() => setShowSettingsModal(true)}
          className="text-gray-600 hover:text-gray-900 dark:text-text-dark dark:hover:text-gray-400 transition"
          title="Project Settings"
        >
          <FontAwesomeIcon icon={faCog} size="lg" />
        </button>
      </header>

      {showSettingsModal && (
        <ProjectSettingsModal onClose={() => setShowSettingsModal(false)} />
      )}

      <div className="flex flex-1 overflow-hidden scrollbar-hide">
        <ProjectSidebar />
        <div className="flex-1 flex flex-col overflow-hidden scrollbar-hide">
          {selectedDoc ? (
            <div className="flex-1 overflow-auto p-5 scrollbar-hide min-w-80">
              {selectedDoc?.outlineNotes && (
                <div className="mb-4 p-4 border-l-4 border-blue-500 bg-blue-50 text-blue-900 rounded shadow-sm">
                  <h3 className="font-semibold mb-1">📌 Outline Notes</h3>
                  <p className="whitespace-pre-wrap">
                    {selectedDoc.outlineNotes}
                  </p>
                </div>
              )}

              <EditorComponent selectedDoc={selectedDoc} isNonfiction={true} />
            </div>
          ) : (
            <p className="text-gray-500 p-5">
              No documents available. Please add one.
            </p>
          )}
        </div>
      </div>
    </div>
  );
}
