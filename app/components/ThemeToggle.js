import { useState, useEffect } from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faSun, faMoon } from '@fortawesome/free-solid-svg-icons';

const ThemeToggle = () => {
  const [darkMode, setDarkMode] = useState(() => {
    return localStorage.getItem('darkMode') === 'true';
  });

  useEffect(() => {
    if (darkMode) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
    localStorage.setItem('darkMode', darkMode);
  }, [darkMode]);

  return (
    <button
      className="p-2   text-text-light dark:text-text-dark hover:text-gray-200 dark:hover:text-gray-700 transition"
      onClick={() => setDarkMode(!darkMode)}
    >
      <FontAwesomeIcon icon={darkMode ? faMoon : faSun} className="text-xl" />
    </button>
  );
};

export default ThemeToggle;
