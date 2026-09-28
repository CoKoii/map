import boundaryData from '../data/kunshan-boundary-gcj02.json';
import { MAP_PLACES } from '../data/placeFixtures';

export function getMapData() {
  return { boundary: boundaryData, places: MAP_PLACES };
}
