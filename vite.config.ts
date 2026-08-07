import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// base MUST match the exact, case-sensitive GitHub repo name ("OneLife")
// so asset URLs resolve correctly on GitHub Pages.
export default defineConfig({
  base: '/OneLife/',
  plugins: [react()],
});
