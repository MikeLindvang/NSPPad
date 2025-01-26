'use client';
import { useState, useEffect } from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import {
  faPlus,
  faTimes,
  faTrash,
  faEdit,
  faArrowRight,
} from '@fortawesome/free-solid-svg-icons';

export default function Dashboard() {
  const [projects, setProjects] = useState([]);
  const [editingId, setEditingId] = useState(null);
  const [newTitle, setNewTitle] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [modalTitle, setModalTitle] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    async function fetchProjects() {
      try {
        const res = await fetch('/api/projects');
        if (!res.ok) {
          throw new Error(`Failed to fetch projects. Status: ${res.status}`);
        }

        const text = await res.text();
        const data = text ? JSON.parse(text) : [];

        setProjects(Array.isArray(data) ? data : []);
      } catch (err) {
        console.error('Error fetching projects:', err);
        setError('Failed to load projects. Please try again later.');
      } finally {
        setLoading(false);
      }
    }

    fetchProjects();
  }, []);

  // Handle creating a new project
  const handleCreateProject = async () => {
    if (!modalTitle.trim()) return;

    const res = await fetch('/api/projects', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ title: modalTitle }),
    });

    if (res.ok) {
      const newProject = await res.json();
      setProjects([...projects, newProject]);
      setShowModal(false);
      setModalTitle('');
    } else {
      console.error('Failed to create a new project');
    }
  };

  // Handle renaming a project
  const handleRename = async (projectId) => {
    if (!newTitle.trim()) return;

    const res = await fetch(`/api/projects/${projectId}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ title: newTitle }),
    });

    if (res.ok) {
      setProjects(
        projects.map((project) =>
          project._id === projectId ? { ...project, title: newTitle } : project
        )
      );
      setEditingId(null);
    } else {
      console.error('Failed to rename project');
    }
  };

  // Handle deleting a project
  const handleDeleteProject = async (projectId) => {
    if (!confirm('Are you sure you want to delete this project?')) return;

    const res = await fetch(`/api/projects/${projectId}`, {
      method: 'DELETE',
    });

    if (res.ok) {
      setProjects(projects.filter((project) => project._id !== projectId));
    } else {
      console.error('Failed to delete project');
    }
  };

  return (
    <div className="min-h-screen bg-gray-100 p-10">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold">Your Projects</h1>
        <button
          onClick={() => setShowModal(true)}
          className="text-blue-500 hover:text-blue-700 text-3xl"
          title="New Project"
        >
          <FontAwesomeIcon icon={faPlus} />
        </button>
      </div>

      {loading && <p className="text-gray-600">Loading projects...</p>}
      {error && <p className="text-red-500">{error}</p>}

      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6">
        {projects.length > 0
          ? projects.map((project) => (
              <div
                key={project._id}
                className="p-5 bg-white shadow rounded-lg hover:shadow-lg transition relative"
              >
                <div className="flex justify-between items-center mb-2">
                  {editingId === project._id ? (
                    <input
                      type="text"
                      value={newTitle}
                      onChange={(e) => setNewTitle(e.target.value)}
                      onBlur={() => handleRename(project._id)}
                      onKeyDown={(e) =>
                        e.key === 'Enter' && handleRename(project._id)
                      }
                      className="text-xl font-bold border rounded-md p-1 w-full"
                      autoFocus
                    />
                  ) : (
                    <h2 className="text-xl font-bold truncate">
                      {project.title}
                    </h2>
                  )}

                  <div className="flex space-x-2">
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        setEditingId(project._id);
                        setNewTitle(project.title);
                      }}
                      className="text-gray-500 hover:text-gray-700"
                      title="Edit Project"
                    >
                      <FontAwesomeIcon icon={faEdit} />
                    </button>

                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        handleDeleteProject(project._id);
                      }}
                      className="text-red-500 hover:text-red-700"
                      title="Delete Project"
                    >
                      <FontAwesomeIcon icon={faTrash} />
                    </button>

                    <button
                      onClick={() =>
                        (window.location.href = `/projects/${project._id}`)
                      }
                      className="text-blue-500 hover:text-blue-700"
                      title="Open Project"
                    >
                      <FontAwesomeIcon icon={faArrowRight} />
                    </button>
                  </div>
                </div>
                <p className="text-gray-500 text-sm">
                  Updated:{' '}
                  {project.updatedAt
                    ? new Date(project.updatedAt).toLocaleString()
                    : 'N/A'}
                </p>
              </div>
            ))
          : !loading && (
              <p className="text-gray-500">
                No projects found. Click the plus icon to create one.
              </p>
            )}
      </div>

      {showModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex justify-center items-center">
          <div className="bg-white p-8 rounded-lg shadow-lg w-96">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-2xl font-bold">Create New Project</h2>
              <button onClick={() => setShowModal(false)}>
                <FontAwesomeIcon
                  icon={faTimes}
                  className="text-gray-500 hover:text-gray-700"
                />
              </button>
            </div>
            <input
              type="text"
              value={modalTitle}
              onChange={(e) => setModalTitle(e.target.value)}
              className="w-full p-2 border rounded-md mb-4"
              placeholder="Enter project name"
            />
            <button
              onClick={handleCreateProject}
              className="w-full bg-blue-500 text-white py-2 rounded-md hover:bg-blue-700"
            >
              Create Project
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
