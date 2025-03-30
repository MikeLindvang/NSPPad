'use client';

import { useState } from 'react';
import { useProject } from '../context/ProjectContext';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faArrowLeft, faArrowRight } from '@fortawesome/free-solid-svg-icons';

import NonfictionBookSetup from './NonfictionBookSetup';
import NonfictionOutlineGenerator from './NonfictionOutlineGenerator';
import NonfictionChapterCreator from './NonfictionChapterCreator';
import NonfictionEditorPage from './NonfictionEditorPage';

export default function NonfictionWorkflow() {
  const { project, setProject, loading, error } = useProject();
  const steps = ['setup', 'outline', 'chapters', 'writing'];
  const [stepIndex, setStepIndex] = useState(0);
  const [updating, setUpdating] = useState(false);

  const step = steps[stepIndex];

  const handleUpdateAndNext = async (updatedProject) => {
    setUpdating(true);
    try {
      // setProject(updatedProject);
      setStepIndex((prev) => Math.min(prev + 1, steps.length - 1)); // ✅ safe update
    } finally {
      setUpdating(false);
    }
  };

  const goNext = () => {
    setStepIndex((prev) => Math.min(prev + 1, steps.length - 1));
    console.log('STEP: ', stepIndex);
  };

  const goBack = () => setStepIndex((prev) => Math.max(prev - 1, 0));

  if (loading || !project)
    return <p className="p-10 text-gray-600">Loading project...</p>;
  if (error)
    return <p className="p-10 text-red-500">Failed to load project: {error}</p>;

  return (
    <div className="min-h-screen p-8 bg-gray-50 dark:bg-background-darkalt dark:text-text-dark">
      {/* Progress Bar */}
      <div className="w-full h-2 bg-gray-300 rounded mb-6">
        <div
          className="h-2 bg-blue-600 rounded transition-all duration-300"
          style={{ width: `${((stepIndex + 1) / steps.length) * 100}%` }}
        />
      </div>

      {updating ? (
        <div className="text-center text-blue-600 font-semibold py-10">
          Saving and loading next step...
        </div>
      ) : (
        <>
          {step === 'setup' && (
            <NonfictionBookSetup
              project={project}
              onContinue={handleUpdateAndNext}
            />
          )}
          {step === 'outline' && (
            <NonfictionOutlineGenerator
              project={project}
              onContinue={handleUpdateAndNext}
            />
          )}
          {step === 'chapters' && (
            <NonfictionChapterCreator
              project={project}
              onContinue={handleUpdateAndNext}
            />
          )}
          {step === 'writing' && <NonfictionEditorPage project={project} />}
        </>
      )}

      {/* Navigation */}
      {step !== 'writing' && !updating && (
        <div className="flex justify-between items-center mt-10">
          <button
            onClick={goBack}
            disabled={stepIndex === 0}
            className="text-gray-600 hover:text-gray-800 disabled:opacity-40"
          >
            <FontAwesomeIcon icon={faArrowLeft} /> Previous
          </button>

          <div className="text-sm text-gray-700 dark:text-gray-300">
            Step {stepIndex + 1} of {steps.length} — <strong>{step}</strong>
          </div>

          <button
            onClick={goNext}
            disabled={stepIndex === steps.length - 1}
            className="text-blue-600 hover:text-blue-800 disabled:opacity-40"
          >
            Next <FontAwesomeIcon icon={faArrowRight} />
          </button>
        </div>
      )}
    </div>
  );
}
