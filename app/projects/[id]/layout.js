'use client';

import { ProjectProvider } from '@/app/context/ProjectContext';
import { DocumentProvider } from '@/app/context/DocumentContext';
import { FeedbackProvider } from '@/app/context/FeedbackContext';
import { EditorProvider } from '@/app/context/EditorContext';
import { use } from 'react';

export default function ProjectLayout({ children, params }) {
  const resolvedParams = use(params); // Resolve the params Promise
  const { id } = resolvedParams; // Extract project ID from the resolved params

  return (
    <ProjectProvider projectId={id}>
      <DocumentProvider>
        <FeedbackProvider>
          <EditorProvider>
            <div className="min-h-screen  bg-gray-100">{children}</div>
          </EditorProvider>
        </FeedbackProvider>
      </DocumentProvider>
    </ProjectProvider>
  );
}
