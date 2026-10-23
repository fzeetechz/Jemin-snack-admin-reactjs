import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react-swc';
import path from 'path';

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  server: {
    port: 5175,
    strictPort: true,
  },
  resolve: {
    alias: {
      src: path.resolve(__dirname, './src'),
      '@mocks': path.resolve(__dirname, './public/mocks'),
    },
  },
});
