'use client';

import { ProjectProvider } from '@/app/context/ProjectContext';
import { use } from 'react';

export default function ProjectLayout({ children, params }) {
  const resolvedParams = use(params); // Resolve the params Promise
  const { id } = resolvedParams; // Extract project ID from the resolved params

  return (
    <ProjectProvider projectId={id}>
      <div className="min-h-screen bg-gray-100">{children}</div>
    </ProjectProvider>
  );
}
