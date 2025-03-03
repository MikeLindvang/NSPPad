/** @type {import('tailwindcss').Config} */
export default {
  content: [
    './pages/**/*.{js,ts,jsx,tsx,mdx}',
    './components/**/*.{js,ts,jsx,tsx,mdx}',
    './app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  darkMode: 'class', // Enables dark mode using class
  theme: {
    extend: {
      colors: {
        background: {
          light: '#f9f9f9',
          dark: '#1a1a1a',
          accent: '#333',
          darkalt: '#0a0a0a',
        },
        text: {
          light: '#333',
          dark: '#e0e0e0',
          accentlight: '#0a0a0a',
          accentdark: '#f9f9f9',
        },
        primary: {
          light: '#3b82f6', // Blue-500
          dark: '#1e3a8a', // Blue-900
        },
        accent: {
          light: '#f59e0b', // Amber-500
          dark: '#b45309', // Amber-900
        },
      },
      fontFamily: {
        body: ['Inter', 'Arial', 'sans-serif'],
        header: ['Merriweather', 'Georgia', 'serif'],
        ui: ['Inter', 'sans-serif'],
      },
    },
  },
  plugins: [],
};
