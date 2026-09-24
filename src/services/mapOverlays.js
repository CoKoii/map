import { BUILDING_SPECS, INITIAL_BUILDING_SCALE, POINT_MARKER_LIFT } from '../config/map';
import { getRoutePrefix } from '../utils/coordinates';

function getBoundaryPaths(boundary) {
  const polygons = boundary.geometry.type === 'Polygon' ? [boundary.geometry.coordinates] : boundary.geometry.coordinates;
  return polygons.map(([outerRing]) => outerRing);
}

export function addBoundaryLayers(map, AMap, boundary) {
  const paths = getBoundaryPaths(boundary);
  const glow = new AMap.Polygon({ path: paths, fillOpacity: 0, strokeColor: '#f4c365', strokeOpacity: 0.16, strokeWeight: 8, zIndex: 40 });
  const boundaryFill = new AMap.Polygon({
    path: paths,
    fillColor: '#2d7b7c',
    fillOpacity: 0.15,
    strokeColor: '#ffd77e',
    strokeOpacity: 0.96,
    strokeWeight: 2.4,
    zIndex: 41
  });
  map.add([glow, boundaryFill]);
  return [glow, boundaryFill];
}

const PLACE_ICON_MARKUP = {
  building: '<path d="M6 22V4a2 2 0 0 1 2-2h8a2 2 0 0 1 2 2v18Z"/><path d="M6 12H4a2 2 0 0 0-2 2v6a2 2 0 0 0 2 2h2"/><path d="M18 9h2a2 2 0 0 1 2 2v9a2 2 0 0 1-2 2h-2"/><path d="M10 6h4M10 10h4M10 14h4M10 18h4"/>',
  tree: '<path d="m17 14 3 3.3a1 1 0 0 1-.7 1.7H4.7a1 1 0 0 1-.7-1.7L7 14h-.3a1 1 0 0 1-.7-1.7L9 9h-.2A1 1 0 0 1 8 7.3L12 3l4 4.3a1 1 0 0 1-.8 1.7H15l3 3.3a1 1 0 0 1-.7 1.7H17ZM12 22v-3"/>'
};

function getPlaceIconMarkup(icon, color) {
  return `<span style="display:grid;place-items:center;width:24px;height:24px;border:2px solid ${color};border-radius:50%;background:${color};color:#102629"><svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${PLACE_ICON_MARKUP[icon] || PLACE_ICON_MARKUP.building}</svg></span>`;
}

export function addPlaceHighlight(map, AMap, place, location) {
  const marker = new AMap.Marker({
    position: location,
    anchor: 'bottom-center',
    offset: new AMap.Pixel(0, -POINT_MARKER_LIFT),
    zIndex: 60,
    content: `<div style="display:flex;align-items:center;gap:7px;padding:4px 9px 4px 5px;border:1px solid ${place.color};border-radius:8px;background:rgba(12,29,29,.92);color:#fff1b8;font:600 12px 'Noto Sans SC',sans-serif;box-shadow:0 4px 12px rgba(0,0,0,.38);transform:translateY(-4px);white-space:nowrap">${getPlaceIconMarkup(place.icon, place.color)}<b style="font-weight:600;line-height:1.35">${place.name}</b></div>`
  });
  map.add(marker);
  return [marker];
}

function createBuildingPath(origin, spec) {
  const [longitude, latitude] = origin;
  const center = [longitude + spec.x, latitude + spec.y];
  return [
    [center[0] - spec.width, center[1] - spec.depth],
    [center[0] + spec.width * spec.eastScale, center[1] - spec.depth],
    [center[0] + spec.width, center[1] + spec.depth * spec.northScale],
    [center[0] - spec.width * 0.78, center[1] + spec.depth],
    [center[0] - spec.width, center[1] - spec.depth]
  ];
}

export function addPlaceBuildings(map, AMap, location, buildingStyles) {
  const buildings = BUILDING_SPECS.map((spec, index) => new AMap.Polygon({
    path: createBuildingPath(location, spec),
    extrusionHeight: Math.max(1, spec.height * INITIAL_BUILDING_SCALE),
    ...buildingStyles[index],
    fillOpacity: 0.98,
    strokeColor: '#fff3bf',
    strokeOpacity: 0.9,
    strokeWeight: 1.5,
    zIndex: 55
  }));
  map.add(buildings);
  return buildings.map((overlay, index) => ({ overlay, height: BUILDING_SPECS[index].height }));
}

export function setBuildingScale(buildings, scale) {
  const normalizedScale = Math.max(0, Math.min(1, scale));
  buildings.forEach(({ overlay, height }) => {
    const extrusionHeight = Math.max(1, height * normalizedScale);
    if (typeof overlay.setExtrusionHeight === 'function') {
      overlay.setExtrusionHeight(extrusionHeight);
    } else {
      overlay.setOptions({ extrusionHeight });
    }
  });
}

export function removePlaceBuildings(buildings) {
  buildings.forEach(({ overlay }) => overlay.setMap?.(null));
}

export function addRoute(map, AMap, route) {
  const initialPath = getRoutePrefix(route.path, 0);
  const glow = new AMap.Polyline({ path: initialPath, strokeColor: route.color, strokeOpacity: 0.28, strokeWeight: 7, zIndex: 44 });
  const line = new AMap.Polyline({ path: initialPath, strokeColor: route.color, strokeOpacity: 0.96, strokeWeight: 4, showDir: true, zIndex: 58 });
  map.add([glow, line]);
  return [glow, line];
}

export function setRouteProgress(routeOverlays, path, progress) {
  const visiblePath = getRoutePrefix(path, progress);
  routeOverlays.forEach((overlay) => overlay.setPath?.(visiblePath));
}
