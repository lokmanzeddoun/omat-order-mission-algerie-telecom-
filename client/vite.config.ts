import { defineConfig, loadEnv } from 'vite';
import path from 'path';
import react from '@vitejs/plugin-react';
import tsconfigPaths from 'vite-tsconfig-paths';
import svgr from 'vite-plugin-svgr';

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd());
  const API_URL = `${env.VITE_API_URL ?? 'http://localhost:3000'}`;
  const PORT = parseInt(`${env.VITE_PORT ?? '3000'}`, 10);
  return {
    plugins: [react(), tsconfigPaths(), svgr()],
    server: {
      proxy: {
        '/api': API_URL,
      },
      host: '0.0.0.0',
      port: PORT,
    },
    resolve: {
      alias: {
        '@': path.resolve(__dirname, './src'),
      },
    },
    preview: {
      port: 5000,
    },
    base: '/omat',
  };
});
