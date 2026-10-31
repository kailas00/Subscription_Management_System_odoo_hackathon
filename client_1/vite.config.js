import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// /api is proxied to the Express server, so the frontend never hard-codes the API host.
export default defineConfig({
  plugins: [react()],
  server: { port: 5173, proxy: { '/api': 'http://localhost:4000' } },
});
