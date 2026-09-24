import { mkdir, readFile, writeFile } from 'node:fs/promises';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const dist = resolve(root, 'dist');
const output = resolve(root, 'dist-single', 'kunshan-transport-dashboard.html');
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
  const javascript = await assetText(match[1]);
  html = html.replace(match[0], () => `<script type="module">${javascript}</script>`);
}

await mkdir(dirname(output), { recursive: true });
await writeFile(output, html);
console.log(`Wrote ${output} (${(Buffer.byteLength(html) / 1024 / 1024).toFixed(1)} MB)`);
