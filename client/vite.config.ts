import { defineConfig, loadEnv } from 'vite';
import path from 'path';
import react from '@vitejs/plugin-react';
import tsconfigPaths from 'vite-tsconfig-paths';
import svgr from 'vite-plugin-svgr';
import { visualizer } from 'rollup-plugin-visualizer';

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd());
  const API_URL = `${env.VITE_API_URL ?? 'http://localhost:8000'}`;
  const PORT = parseInt(`${env.VITE_PORT ?? '3000'}`, 10);
  return {
    plugins: [
      react(),
      tsconfigPaths(),
      svgr(),
      // `ANALYZE=1 npm run build` writes dist/stats.html (bundle treemap)
      !!process.env.ANALYZE && visualizer({ filename: 'dist/stats.html', gzipSize: true }),
    ],
    server: {
      proxy: {
        '/api': {
          target: API_URL,
          changeOrigin: true,
          rewrite: (path) => path.replace(/^\/api/, ''),
        },
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
    build: {
      rollupOptions: {
        output: {
          // Stable vendor chunks shared by every page. Heavy, page-specific libs
          // (echarts, @react-pdf/renderer) stay in the lazy chunks that use them.
          manualChunks: {
            react: ['react', 'react-dom', 'react-router-dom'],
            redux: ['@reduxjs/toolkit', 'react-redux', 'redux-persist'],
            mui: ['@mui/material', '@emotion/react', '@emotion/styled'],
            'mui-data-grid': ['@mui/x-data-grid'],
          },
        },
      },
    },
    base: '/omat',
  };
});
