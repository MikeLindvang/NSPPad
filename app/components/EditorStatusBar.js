import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faCheckSquare, faSquare } from '@fortawesome/free-regular-svg-icons';

export default function EditorStatusBar({
  wordCount,
  lastSaved,
  enhancementOptions = {}, // Default to an empty object
  setEnhancementOptions,
}) {
  const optionsList = [
    'sensoryDetails',
    'emotionalResonance',
    'deepPOV',
    'conflict',
  ];

  // ✅ Determine if all or none are selected
  const allSelected = optionsList.every((option) => enhancementOptions[option]);
  const noneSelected = optionsList.every(
    (option) => !enhancementOptions[option]
  );

  // ✅ Handle individual checkbox toggle
  const handleCheckboxChange = (option) => {
    if (!setEnhancementOptions) return;
    setEnhancementOptions((prevOptions) => ({
      ...prevOptions,
      [option]: !prevOptions[option],
    }));
  };

  // ✅ Handle "Select All" toggle (Select all if none are selected, otherwise deselect all)
  const handleSelectAll = () => {
    if (!setEnhancementOptions) return;

    setEnhancementOptions(
      noneSelected
        ? Object.fromEntries(optionsList.map((option) => [option, true])) // Select all
        : Object.fromEntries(optionsList.map((option) => [option, false])) // Deselect all
    );
  };

  return (
    <div className="fixed bottom-0 left-0 w-full bg-gray-800 text-gray-200 px-4 py-2 flex justify-between items-center shadow-md">
      {/* 🔹 Word Count */}
      <div className="text-sm">
        📝 <strong>Word Count:</strong> {wordCount}
      </div>

      {/* 🔹 Enhancement Options */}
      <div className="text-sm flex items-center space-x-4">
        {/* 🔘 "Select All" Toggle */}

        <FontAwesomeIcon
          className="px-2 py-1  text-white hover:text-blue-300 transition"
          onClick={handleSelectAll}
          icon={noneSelected ? faCheckSquare : faSquare}
          size="lg"
        />

        {/* ✅ Enhancement Checkboxes */}
        {optionsList.map((option) => (
          <label
            key={option}
            className="flex items-center space-x-1 cursor-pointer"
          >
            <input
              type="checkbox"
              checked={enhancementOptions[option]}
              onChange={() => handleCheckboxChange(option)}
              className="form-checkbox text-blue-500"
            />
            <span>{option.replace(/([A-Z])/g, ' $1').trim()}</span>
          </label>
        ))}
      </div>

      {/* 🔹 Last Saved Timestamp */}
      <div className="text-sm min-w-[120px] text-center">
        💾 Last Saved:{' '}
        {lastSaved ? new Date(lastSaved).toLocaleTimeString() : 'Not Saved'}
      </div>
    </div>
  );
}
