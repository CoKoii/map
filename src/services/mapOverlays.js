import { BUILDING_SPECS, INITIAL_BUILDING_SCALE } from '../config/map';
import { getRoutePrefix } from '../utils/coordinates';
import { faBuilding, faTree } from '@fortawesome/free-solid-svg-icons';

const LABEL_CARD_HEIGHT = 44;
const PLACE_LABEL_HEIGHT = LABEL_CARD_HEIGHT + 4;
const LABEL_CLEARANCE = 72;
const LABEL_TEXT_FONT = '600 12px "Noto Sans SC", sans-serif';
const LABEL_TEXT_X = 49;
const LABEL_RIGHT_PADDING = 16;
const MIN_LABEL_WIDTH = 112;
const routeOverlayMetadata = new WeakMap();
let nextRouteId = 1;
let labelMeasureContext;

function toLatLng(TMap, [longitude, latitude]) {
  return new TMap.LatLng(latitude, longitude);
}

function toRgba(color, opacity) {
  const value = Number.parseInt(color.slice(1), 16);
  return `rgba(${value >> 16 & 255}, ${value >> 8 & 255}, ${value & 255}, ${opacity})`;
}

function getBoundaryPaths(boundary) {
  const polygons = boundary.geometry.type === 'Polygon' ? [boundary.geometry.coordinates] : boundary.geometry.coordinates;
  return polygons.map(([outerRing]) => outerRing);
}

export function addBoundaryLayers(map, TMap, boundary) {
  const geometries = getBoundaryPaths(boundary).map((path, index) => ({
    id: `boundary-${index}`,
    paths: path.map((point) => toLatLng(TMap, point)),
    styleId: 'boundary'
  }));
  const glow = new TMap.MultiPolygon({
    map,
    geometries,
    styles: { boundary: new TMap.PolygonStyle({ color: 'rgba(0,0,0,0)', borderColor: 'rgba(244,195,101,0.16)', borderWidth: 8, showBorder: true }) }
  });
  const fill = new TMap.MultiPolygon({
    map,
    geometries,
    styles: { boundary: new TMap.PolygonStyle({ color: 'rgba(45,123,124,0.15)', borderColor: 'rgba(255,215,126,0.96)', borderWidth: 3, showBorder: true }) }
  });
  return [glow, fill];
}

const PLACE_ICONS = {
  building: faBuilding.icon,
  tree: faTree.icon
};

function escapeXml(value) {
  return String(value).replace(/[<>&"']/g, (character) => ({ '<': '&lt;', '>': '&gt;', '&': '&amp;', '"': '&quot;', "'": '&apos;' })[character]);
}

function getPlaceLabelWidth(name) {
  labelMeasureContext ||= document.createElement('canvas').getContext('2d');
  labelMeasureContext.font = LABEL_TEXT_FONT;
  const textWidth = labelMeasureContext.measureText(name).width;
  return Math.ceil(Math.max(MIN_LABEL_WIDTH, LABEL_TEXT_X + textWidth + LABEL_RIGHT_PADDING));
}

function placeIcon(place, width) {
  const icon = PLACE_ICONS[place.icon] || PLACE_ICONS.building;
  const [iconWidth, iconHeight, , , path] = icon;
  const svg = `
    <svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${PLACE_LABEL_HEIGHT}" viewBox="0 0 ${width} ${PLACE_LABEL_HEIGHT}">
      <rect x="1" y="2" width="${width - 2}" height="${LABEL_CARD_HEIGHT}" rx="8" fill="#0c1d1d" fill-opacity=".96" stroke="${place.color}"/>
      <circle cx="25" cy="24" r="16" fill="${place.color}"/>
      <svg x="13" y="12" width="24" height="24" viewBox="0 0 ${iconWidth} ${iconHeight}"><path fill="#102629" d="${path}"/></svg>
      <text x="${LABEL_TEXT_X}" y="29" fill="#fff1b8" font-family="Noto Sans SC, sans-serif" font-size="12" font-weight="600">${escapeXml(place.name)}</text>
    </svg>`;
  return `data:image/svg+xml;charset=UTF-8,${encodeURIComponent(svg)}`;
}

function getLabelPosition(map, TMap, location, verticalOffset) {
  const position = toLatLng(TMap, location);
  const point = map.projectToContainer(position);
  if (!point) return position;
  const labelCenter = new TMap.Point(point.x, point.y - LABEL_CLEARANCE - verticalOffset - PLACE_LABEL_HEIGHT / 2 + 2);
  return map.unprojectFromContainer(labelCenter) || position;
}

export function addPlaceHighlight(map, TMap, place, location) {
  const labelWidth = getPlaceLabelWidth(place.name);
  const verticalOffset = place.id === 'east-disposal-center' ? 40 : 0;
  const marker = new TMap.MultiMarker({
    map,
    styles: { place: new TMap.MarkerStyle({
      width: labelWidth,
      height: PLACE_LABEL_HEIGHT,
      anchor: new TMap.Point(labelWidth / 2, PLACE_LABEL_HEIGHT / 2),
      src: placeIcon(place, labelWidth)
    }) },
    geometries: [{ id: `place-${place.id}`, position: getLabelPosition(map, TMap, location, verticalOffset), styleId: 'place' }]
  });
  return [marker];
}

function buildingPath([longitude, latitude], spec) {
  const center = [longitude + spec.x, latitude + spec.y];
  return [
    [center[0] - spec.width, center[1] - spec.depth],
    [center[0] + spec.width * spec.eastScale, center[1] - spec.depth],
    [center[0] + spec.width, center[1] + spec.depth * spec.northScale],
    [center[0] - spec.width * 0.78, center[1] + spec.depth],
    [center[0] - spec.width, center[1] - spec.depth]
  ];
}

function buildingStyle(TMap, style, height) {
  return new TMap.ExtrudablePolygonStyle({
    color: toRgba(style.fillColor, 0.98),
    borderColor: toRgba(style.roofColor, 0.9),
    borderWidth: 1.5,
    showBorder: true,
    extrudeHeight: Math.max(1, height)
  });
}

export function addPlaceBuildings(map, TMap, location, buildingStyles) {
  return BUILDING_SPECS.map((spec, index) => {
    const style = buildingStyles[index];
    const overlay = new TMap.MultiPolygon({
      map,
      geometries: [{ id: `building-${index}`, paths: buildingPath(location, spec).map((point) => toLatLng(TMap, point)), styleId: 'building' }],
      styles: { building: buildingStyle(TMap, style, spec.height * INITIAL_BUILDING_SCALE) }
    });
    return { overlay, height: spec.height, TMap, style };
  });
}

export function setBuildingScale(buildings, scale) {
  const normalizedScale = Math.max(0, Math.min(1, scale));
  buildings.forEach(({ overlay, height, TMap, style }) => {
    overlay.setStyles({ building: buildingStyle(TMap, style, height * normalizedScale) });
  });
}

export function removePlaceBuildings(buildings) {
  buildings.forEach(({ overlay }) => overlay.setMap(null));
}

function addRouteLine(map, TMap, path, color, width, opacity) {
  const linePath = path.length === 1
    ? [path[0], [path[0][0] + 0.00001, path[0][1]]]
    : path;
  const geometryId = `route-${nextRouteId++}`;
  const overlay = new TMap.MultiPolyline({
    map,
    geometries: [{ id: geometryId, paths: linePath.map((point) => toLatLng(TMap, point)), styleId: 'route' }],
    styles: { route: new TMap.PolylineStyle({ color: toRgba(color, opacity), width }) }
  });
  routeOverlayMetadata.set(overlay, { TMap, geometryId });
  return overlay;
}

export function addRoute(map, TMap, route) {
  const path = getRoutePrefix(route.path, 0);
  return [
    addRouteLine(map, TMap, path, route.color, 7, 0.28),
    addRouteLine(map, TMap, path, route.color, 4, 0.96)
  ];
}

export function setRouteProgress(routeOverlays, path, progress) {
  const visiblePath = getRoutePrefix(path, progress);
  const linePath = visiblePath.length === 1
    ? [visiblePath[0], [visiblePath[0][0] + 0.00001, visiblePath[0][1]]]
    : visiblePath;
  const metadata = routeOverlayMetadata.get(routeOverlays[0]);
  if (!metadata) return;
  const paths = linePath.map((point) => toLatLng(metadata.TMap, point));
  routeOverlays.forEach((overlay) => {
    const { geometryId } = routeOverlayMetadata.get(overlay);
    overlay.setGeometries([{ id: geometryId, paths, styleId: 'route' }]);
  });
}
