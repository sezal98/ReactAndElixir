import { defineConfig } from 'vite';
import plugin from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [plugin()],
  server: {
    host: '0.0.0.0',  // important for Docker
    port: 5173,        // align with Docker mapped port
    strictPort: true   // avoids picking a random port
  }
});
