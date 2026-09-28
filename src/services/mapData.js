import boundaryData from '../data/kunshan-boundary-gcj02.json';
import { MAP_PLACES, MAP_ROUTES } from '../data/mapFixtures';

export function getMapData() {
  return { boundary: boundaryData, places: MAP_PLACES, routes: MAP_ROUTES };
}

export function getRoutePath(routes, originId, destinationId, coordinates) {
  const routeList = Array.isArray(routes) ? routes : [];
  const direct = routeList.find((route) => route.from === originId && route.to === destinationId);
  if (direct) return direct.path;
  const reverse = routeList.find((route) => route.from === destinationId && route.to === originId);
  if (reverse) return reverse.path.slice().reverse();
  return coordinates;
}
