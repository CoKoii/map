import { mkdir, readFile, writeFile } from 'node:fs/promises';
import { transformGeoJSON } from '../src/geo.js';

const DATA_DIR = new URL('../public/data/', import.meta.url);
const OUTPUT_DIR = new URL('../src/data/', import.meta.url);
const files = ['kunshan-boundary'];

await mkdir(OUTPUT_DIR, { recursive: true });

for (const name of files) {
  const source = JSON.parse(await readFile(new URL(`${name}.geojson`, DATA_DIR), 'utf8'));
  const transformed = transformGeoJSON(source);
  await writeFile(new URL(`${name}-gcj02.json`, OUTPUT_DIR), `${JSON.stringify(transformed)}\n`);
}

console.log('Prepared AMap GCJ-02 boundary data in src/data');
