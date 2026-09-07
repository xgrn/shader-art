/// <reference types="vitest/config" />
import { fileURLToPath } from 'node:url';
import { defineConfig } from 'vite';
import preact from '@preact/preset-vite';
import tailwindcss from '@tailwindcss/vite';

const path = (rel: string) => fileURLToPath(new URL(rel, import.meta.url));

// Served from https://xgrn.github.io/shader-art/ on GitHub Pages; '/' for `npm run dev`.
const BASE = '/shader-art/';

export default defineConfig(({ command }) => ({
  base: command === 'build' ? BASE : '/',
  plugins: [preact(), tailwindcss()],
  build: {
    rollupOptions: {
      input: {
        main: path('index.html'),
        'sine-colors': path('examples/sine-colors/index.html'),
        'orbiting-dot': path('examples/orbiting-dot/index.html'),
        limacon: path('examples/limacon/index.html'),
        julia: path('examples/julia/index.html'),
        'domain-warp': path('examples/domain-warp/index.html'),
        cube: path('examples/cube/index.html'),
      },
    },
  },
  test: {
    globals: true,
    environment: 'node',
    include: ['tests/**/*.test.ts'],
  },
}));
