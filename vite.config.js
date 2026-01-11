// vite.config.js
import { defineConfig } from 'vite';
import glsl from 'vite-plugin-glsl';

export default defineConfig({
  base: '/ACG_group_work/',
  plugins: [glsl()] // これを追加！
});