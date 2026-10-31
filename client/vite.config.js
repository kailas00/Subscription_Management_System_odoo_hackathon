import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// /api is proxied to the Express server, so the frontend never hard-codes the API host.
const securityHeaders = {
  'X-Content-Type-Options': 'nosniff',
  'X-Frame-Options': 'DENY',
  'Referrer-Policy': 'strict-origin-when-cross-origin',
  'Permissions-Policy': 'camera=(), microphone=(), geolocation=()',
};

export default defineConfig({
  plugins: [react()],
  server: { port: 5173, proxy: { '/api': 'http://localhost:4000' }, headers: securityHeaders },
  // Production preview gets a strict content policy too (dev needs inline scripts for hot reload).
  preview: { headers: { ...securityHeaders, 'Content-Security-Policy': "default-src 'self'; script-src 'self'; style-src 'self' 'unsafe-inline' https://fonts.googleapis.com; font-src 'self' https://fonts.gstatic.com; img-src 'self' data:; connect-src 'self'; frame-ancestors 'none'; base-uri 'self'; form-action 'self'" } },
});
