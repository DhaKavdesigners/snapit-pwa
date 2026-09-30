import { defineConfig, Plugin } from 'vite'
import react from '@vitejs/plugin-react'
import fs from 'fs'
import path from 'path'

// Vite plugin: stamps __BUILD_TIME__ into sw.js at build time so
// every Vercel deploy creates a new cache version — users always
// get fresh code on next app open, no APK repackage needed.
function stampServiceWorker(): Plugin {
  const buildTime = Date.now().toString();
  return {
    name: 'stamp-service-worker',
    // During dev, also stamp the sw.js so it works properly
    buildStart() {
      const swSrc = path.resolve(__dirname, 'public/sw.js');
      if (fs.existsSync(swSrc)) {
        let content = fs.readFileSync(swSrc, 'utf-8');
        // Replace any existing timestamp with fresh one
        content = content.replace(/'__BUILD_TIME__'|'minnit-pwa-\d+'/, `'${buildTime}'`);
        // Write to dist/sw.js after build
        this.emitFile({
          type: 'asset',
          fileName: 'sw.js',
          source: content,
        });
      }
    },
  };
}

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react(), stampServiceWorker()],
})
