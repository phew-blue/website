// @ts-check
/// <reference types="node" />
import { defineConfig, fontProviders } from 'astro/config';
import sitemap from '@astrojs/sitemap';
import tailwindcss from '@tailwindcss/vite';
import { fileURLToPath } from 'url';
import path from 'path';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

export default defineConfig({
  site: 'https://phew.blue',
  output: 'static',
  integrations: [sitemap()],
  // Poppins is vendored into src/assets/fonts and emitted with the build, so
  // first paint costs no third-party round trip and the build itself needs no
  // network for fonts — the Docker/CI build stays reproducible.
  //
  // These are Google's own latin-subset woff2 files (24kB for all three). Only
  // the weights the site uses are carried: 400 body, 600 headings, 700 bold.
  // Weight 500 was requested from Google Fonts previously but never applied.
  fonts: [
    {
      name: 'Poppins',
      cssVariable: '--font-poppins',
      provider: fontProviders.local(),
      fallbacks: ['system-ui', 'sans-serif'],
      options: {
        variants: [
          { weight: 400, style: 'normal', src: ['./src/assets/fonts/poppins-400.woff2'] },
          { weight: 600, style: 'normal', src: ['./src/assets/fonts/poppins-600.woff2'] },
          { weight: 700, style: 'normal', src: ['./src/assets/fonts/poppins-700.woff2'] },
        ],
      },
    },
  ],
  vite: {
    plugins: [tailwindcss()],
    resolve: {
      alias: {
        '@assets': path.resolve(__dirname, 'src/assets'),
      },
    },
  },
});
