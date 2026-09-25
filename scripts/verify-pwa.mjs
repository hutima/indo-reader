import { access, readFile } from 'node:fs/promises';
import path from 'node:path';

const dist = path.resolve('dist');
const required = [
  'index.html',
  'manifest.webmanifest',
  'sw.js',
  'icons/icon-192.png',
  'icons/icon-512.png',
  'icons/icon-512-maskable.png',
];

for (const file of required) {
  await access(path.join(dist, file));
}

const manifest = JSON.parse(await readFile(path.join(dist, 'manifest.webmanifest'), 'utf8'));
if (manifest.display !== 'standalone') throw new Error('PWA manifest must use standalone display mode.');
if (manifest.start_url !== './') throw new Error('PWA start_url must remain relative for GitHub Pages.');
if (manifest.scope !== './') throw new Error('PWA scope must remain relative for GitHub Pages.');
if (!Array.isArray(manifest.icons) || manifest.icons.length < 3) throw new Error('PWA manifest icons are incomplete.');

const worker = await readFile(path.join(dist, 'sw.js'), 'utf8');
if (!worker.includes('indo-reader-data-v1')) throw new Error('Runtime AGS/PBWL cache missing from built service worker.');
if (!worker.includes('SKIP_WAITING')) throw new Error('User-triggered update activation missing from built service worker.');

console.log('PWA artifact verification passed.');
