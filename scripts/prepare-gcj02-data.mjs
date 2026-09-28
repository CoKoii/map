import { mkdir, readFile, writeFile } from 'node:fs/promises';
import { transformGeoJSON } from '../src/geo.js';

const SOURCE_DIR = new URL('../public/data/', import.meta.url);
const OUTPUT_DIR = new URL('../src/data/', import.meta.url);
const BOUNDARY_FILE = 'kunshan-boundary';

await mkdir(OUTPUT_DIR, { recursive: true });

const source = JSON.parse(await readFile(new URL(`${BOUNDARY_FILE}.geojson`, SOURCE_DIR), 'utf8'));
const transformed = transformGeoJSON(source);
await writeFile(
  new URL(`${BOUNDARY_FILE}-gcj02.json`, OUTPUT_DIR),
  `${JSON.stringify(transformed)}\n`
);

console.log(`Prepared GCJ-02 boundary data in ${OUTPUT_DIR.pathname}`);
