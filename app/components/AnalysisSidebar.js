export default function AnalysisSidebar() {
  const dummyFeedback = {
    sensoryDetails: [
      'Add more visual details in paragraph 2.',
      'Consider describing smells to enhance immersion.',
    ],
    povDepth: [
      'Avoid using filtering words like "he felt".',
      'Make the internal thoughts clearer.',
    ],
    emotionalResonance: [
      'Strengthen character reactions in dialogue.',
      'Show more internal conflict.',
    ],
    conflictTension: [
      'Increase stakes in the final paragraph.',
      "Add urgency to the protagonist's goal.",
    ],
  };

  return (
    <div className="w-96 bg-slate-200 shadow-lg p-6 border-l border-gray-300 fixed right-0 top-0 h-full overflow-y-auto">
      <h2 className="text-xl font-bold mb-4">Depth Analysis Feedback</h2>
      {Object.entries(dummyFeedback).map(([category, suggestions]) => (
        <div key={category} className="mt-4">
          <h3 className="font-semibold capitalize">
            {category.replace(/([A-Z])/g, ' $1')}
          </h3>
          <ul className="list-disc pl-5 text-sm text-gray-700">
            {suggestions.map((item, index) => (
              <li key={index}>{item}</li>
            ))}
          </ul>
        </div>
      ))}
    </div>
  );
}
