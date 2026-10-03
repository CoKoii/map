import { cp, mkdir, readFile, rm, writeFile } from 'node:fs/promises';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const dist = resolve(root, 'dist');
const outputDir = resolve(root, 'dist-single');
const output = resolve(outputDir, 'index.html');
const distAssets = resolve(dist, 'assets');
let html = await readFile(resolve(dist, 'index.html'), 'utf8');

const assetText = async (assetPath) => {
  const normalizedPath = assetPath.replace(/^\.\//, '');
  return readFile(resolve(dist, normalizedPath), 'utf8');
};

for (const match of [...html.matchAll(/<link[^>]+href="([^"]+\.css)"[^>]*>/g)]) {
  const css = await assetText(match[1]);
  html = html.replace(match[0], () => `<style>${css}</style>`);
}

for (const match of [...html.matchAll(/<script[^>]+src="([^"]+\.js)"[^>]*><\/script>/g)]) {
  // The module moves from dist/assets into the HTML document. Keep Vite's
  // relative binary asset URLs rooted next to the generated HTML.
  const javascript = (await assetText(match[1])).replace(
    /new URL\((["'])(?![./])([^"']+)\1,import\.meta\.url\)/g,
    'new URL($1./$2$1,import.meta.url)'
  );
  html = html.replace(match[0], () => `<script type="module">${javascript}</script>`);
}

await rm(outputDir, { recursive: true, force: true });
await mkdir(outputDir, { recursive: true });
await cp(resolve(distAssets, 'car.glb'), resolve(outputDir, 'car.glb'));
await writeFile(output, html);
console.log(`Wrote ${output} (${(Buffer.byteLength(html) / 1024 / 1024).toFixed(1)} MB)`);
