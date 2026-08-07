/** @type {import('tailwindcss').Config} */
export default {
  // System light/dark preference only — no manual theme toggle.
  darkMode: 'media',
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  theme: {
    extend: {},
  },
  plugins: [],
};
