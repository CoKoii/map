import { mkdir, writeFile } from 'node:fs/promises';
import { transformGeoJSON } from '../src/geo.js';

const OUTPUT_DIR = new URL('../public/data/', import.meta.url);
const SOURCE_DIR = new URL('../src/data/', import.meta.url);
const USER_AGENT = 'kunshan-dashboard-boundary-preload/1.0';
const REQUEST_TIMEOUT = 60000;

async function fetchBoundary() {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), REQUEST_TIMEOUT);
  try {
    const response = await fetch(
      'https://nominatim.openstreetmap.org/search?q=%E6%98%86%E5%B1%B1%E5%B8%82%2C%E6%B1%9F%E8%8B%8F%E7%9C%81%2C%E4%B8%AD%E5%9B%BD&format=jsonv2&polygon_geojson=1&limit=10',
      { signal: controller.signal, headers: { 'User-Agent': USER_AGENT, Accept: 'application/json' } }
    );
    if (!response.ok) throw new Error(`${response.status} ${response.statusText}`);
    const results = await response.json();
    const match = results
      .filter(({ geojson }) => geojson && ['Polygon', 'MultiPolygon'].includes(geojson.type))
      .sort((left, right) => Number(right.type === 'administrative') - Number(left.type === 'administrative'))[0];
    if (!match) throw new Error('Kunshan administrative boundary was not found');
    return { type: 'Feature', properties: { name: 'Kunshan', source: 'Nominatim' }, geometry: match.geojson };
  } finally {
    clearTimeout(timeout);
  }
}

const boundary = await fetchBoundary();
await mkdir(OUTPUT_DIR, { recursive: true });
await mkdir(SOURCE_DIR, { recursive: true });
await Promise.all([
  writeFile(new URL('kunshan-boundary.geojson', OUTPUT_DIR), `${JSON.stringify(boundary)}\n`),
  writeFile(new URL('kunshan-boundary-gcj02.json', SOURCE_DIR), `${JSON.stringify(transformGeoJSON(boundary))}\n`)
]);
console.log('Saved Kunshan boundary data in src/data; buildings remain supplied by AMap.');
