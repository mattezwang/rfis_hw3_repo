// Build configuration. Relative base path so the static build can be deployed to any host or
// subpath (constitution: Prototype Constraints; research.md R-7).
import { defineConfig } from 'vitest/config';
import react from '@vitejs/plugin-react';

export default defineConfig({
  base: './',
  plugins: [react()],
  test: {
    include: ['tests/**/*.test.ts'],
    environment: 'node',
  },
});
