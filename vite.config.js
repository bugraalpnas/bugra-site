import { defineConfig } from 'vite';
import { resolve } from 'path';

export default defineConfig({
  plugins: [
    {
      name: 'copy-admin-config',
      closeBundle() {
        // Simple copy of config.yml to dist/admin/config.yml since it's not imported by JS
        const fs = require('fs');
        const path = require('path');
        const destDir = resolve(__dirname, 'dist/admin');
        if (!fs.existsSync(destDir)) {
          fs.mkdirSync(destDir, { recursive: true });
        }
        fs.copyFileSync(
          resolve(__dirname, 'admin/config.yml'),
          resolve(destDir, 'config.yml')
        );
        console.log('Copied admin/config.yml to dist/admin/config.yml');
      }
    }
  ],
  build: {
    rollupOptions: {
      input: {
        main: resolve(__dirname, 'index.html'),
        posts: resolve(__dirname, 'posts.html'),
        documents: resolve(__dirname, 'documents.html'),
        post: resolve(__dirname, 'post.html'),
        admin: resolve(__dirname, 'admin/index.html'),
      },
    },
  },
});
