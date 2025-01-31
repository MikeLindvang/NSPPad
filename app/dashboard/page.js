'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import {
  faPlus,
  faTrash,
  faEdit,
  faArrowRight,
  faSearch,
} from '@fortawesome/free-solid-svg-icons';

export default function Dashboard() {
  const [projects, setProjects] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [modalVisible, setModalVisible] = useState(false);
  const [newProjectTitle, setNewProjectTitle] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const router = useRouter();

  // Fetch projects on load
  useEffect(() => {
    async function fetchProjects() {
      try {
        const res = await fetch('/api/projects');

        if (!res.ok) {
          throw new Error('Failed to fetch projects.');
        }

        const data = await res.json();

        // Sort projects by updatedAt (newest first)
        const sortedProjects = data.sort(
          (a, b) => new Date(b.updatedAt) - new Date(a.updatedAt)
        );

        setProjects(sortedProjects);
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
    if (!newProjectTitle.trim()) {
      alert('Project title cannot be empty!');
      return;
    }

    try {
      const res = await fetch('/api/projects', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ title: newProjectTitle }),
      });

      if (!res.ok) {
        throw new Error('Failed to create project.');
      }

      const newProject = await res.json();

      // Redirect to the new project page
      router.push(`/projects/${newProject._id}`);
    } catch (err) {
      console.error('Error creating project:', err);
      alert('An error occurred. Please try again.');
    } finally {
      setModalVisible(false);
      setNewProjectTitle('');
    }
  };

  // Handle deleting a project
  const handleDeleteProject = async (projectId) => {
    if (!confirm('Are you sure you want to delete this project?')) return;

    try {
      const res = await fetch(`/api/projects/${projectId}`, {
        method: 'DELETE',
      });

      if (!res.ok) {
        throw new Error('Failed to delete project.');
      }

      // Remove the deleted project from the state
      setProjects(projects.filter((project) => project._id !== projectId));
    } catch (err) {
      console.error('Error deleting project:', err);
      alert('An error occurred while deleting the project.');
    }
  };

  // Filter projects based on search query
  const filteredProjects = projects.filter((project) =>
    project.title.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="min-h-screen bg-gray-100 p-10">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold">Your Projects</h1>
        <button
          onClick={() => setModalVisible(true)}
          className="text-blue-500 hover:text-blue-700 text-3xl"
          title="New Project"
        >
          <FontAwesomeIcon icon={faPlus} />
        </button>
      </div>

      <div className="mb-6 flex items-center space-x-2">
        <FontAwesomeIcon icon={faSearch} className="text-gray-500" />
        <input
          type="text"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="p-2 border border-gray-300 rounded-md w-full"
          placeholder="Search projects by title..."
        />
      </div>

      {loading && <p className="text-gray-600">Loading projects...</p>}
      {error && <p className="text-red-500">{error}</p>}

      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6">
        {filteredProjects.map((project) => (
          <div
            key={project._id}
            className="p-5 bg-white shadow rounded-lg hover:shadow-lg transition relative"
          >
            <div className="flex justify-between items-center mb-2">
              <h2 className="text-xl font-bold truncate">{project.title}</h2>
              <div className="flex space-x-2">
                <button
                  onClick={() => handleDeleteProject(project._id)}
                  className="text-red-500 hover:text-red-700"
                  title="Delete Project"
                >
                  <FontAwesomeIcon icon={faTrash} />
                </button>
                <button
                  onClick={() => router.push(`/projects/${project._id}`)}
                  className="text-blue-500 hover:text-blue-700"
                  title="Open Project"
                >
                  <FontAwesomeIcon icon={faArrowRight} />
                </button>
              </div>
            </div>
            <p className="text-gray-500 text-sm">
              Updated:{' '}
              {new Date(project.updatedAt).toLocaleString() || 'Unknown'}
            </p>
          </div>
        ))}
      </div>

      {/* New Project Modal */}
      {modalVisible && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex justify-center items-center">
          <div className="bg-white p-8 rounded-lg shadow-lg w-96">
            <h2 className="text-2xl font-bold mb-4">Create New Project</h2>
            <input
              type="text"
              value={newProjectTitle}
              onChange={(e) => setNewProjectTitle(e.target.value)}
              className="w-full p-2 border rounded-md mb-4"
              placeholder="Enter project name"
            />
            <button
              onClick={handleCreateProject}
              className="w-full bg-blue-500 text-white py-2 rounded-md hover:bg-blue-700"
            >
              Create Project
            </button>
            <button
              onClick={() => setModalVisible(false)}
              className="mt-4 w-full bg-gray-300 text-gray-800 py-2 rounded-md hover:bg-gray-400"
            >
              Cancel
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
