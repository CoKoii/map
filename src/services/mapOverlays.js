import { BUILDING_SPEC, INITIAL_BUILDING_SCALE } from '../config/map';

const PLACE_LABEL_HEIGHT = 28;
const LABEL_CLEARANCE = 72;
const LABEL_TEXT_FONT = '700 12px "Noto Sans SC", sans-serif';
const LABEL_HORIZONTAL_PADDING = 16;
const MIN_LABEL_WIDTH = 110;
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

function escapeXml(value) {
  return String(value).replace(/[<>&"']/g, (character) => ({ '<': '&lt;', '>': '&gt;', '&': '&amp;', '"': '&quot;', "'": '&apos;' })[character]);
}

function getPlaceLabelWidth(name) {
  labelMeasureContext ||= document.createElement('canvas').getContext('2d');
  labelMeasureContext.font = LABEL_TEXT_FONT;
  const label = String(name);
  return Math.ceil(Math.max(MIN_LABEL_WIDTH, labelMeasureContext.measureText(label).width + LABEL_HORIZONTAL_PADDING * 2));
}

function placeLabel(name, width) {
  const text = String(name);
  const center = width / 2;
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${PLACE_LABEL_HEIGHT}" viewBox="0 0 ${width} ${PLACE_LABEL_HEIGHT}">
    <rect x="1" y="1" width="${width - 2}" height="26" rx="7" fill="#0b171b" fill-opacity=".96" stroke="#d1a957" stroke-width="1"/>
    <text x="${center}" y="19" fill="#f5d98f" font-family="Noto Sans SC, sans-serif" font-size="12" font-weight="700" text-anchor="middle">${escapeXml(text)}</text>
  </svg>`;
  return `data:image/svg+xml;charset=UTF-8,${encodeURIComponent(svg)}`;
}

function getLabelPosition(map, TMap, location) {
  const position = toLatLng(TMap, location);
  const point = map.projectToContainer(position);
  if (!point) return position;
  const labelCenter = new TMap.Point(point.x, point.y - LABEL_CLEARANCE - PLACE_LABEL_HEIGHT / 2);
  return map.unprojectFromContainer(labelCenter) || position;
}

function createTextLabelStyle(TMap, name) {
  const width = getPlaceLabelWidth(name);
  return new TMap.MarkerStyle({
    width,
    height: PLACE_LABEL_HEIGHT,
    anchor: new TMap.Point(width / 2, PLACE_LABEL_HEIGHT / 2),
    src: placeLabel(name, width)
  });
}

export function addPlaceHighlight(map, TMap, place, location) {
  return new TMap.MultiMarker({
    map,
    styles: { place: createTextLabelStyle(TMap, place.name) },
    geometries: [{ id: `place-${place.id}`, position: getLabelPosition(map, TMap, location), styleId: 'place' }]
  });
}

function buildingPath([longitude, latitude], spec) {
  const center = [longitude, latitude];
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
    borderWidth: 2.5,
    showBorder: true,
    extrudeHeight: Math.max(1, height)
  });
}

export function addPlaceBuildings(map, TMap, location, style) {
  const overlay = new TMap.MultiPolygon({
    map,
    geometries: [{ id: 'building', paths: buildingPath(location, BUILDING_SPEC).map((point) => toLatLng(TMap, point)), styleId: 'building' }],
    styles: { building: buildingStyle(TMap, style, BUILDING_SPEC.height * INITIAL_BUILDING_SCALE) }
  });
  return { overlay, height: BUILDING_SPEC.height, TMap, style };
}

export function setBuildingScale(building, scale) {
  const normalizedScale = Math.max(0, Math.min(1, scale));
  const { overlay, height, TMap, style } = building;
  overlay.setStyles({ building: buildingStyle(TMap, style, height * normalizedScale) });
}

export function removePlaceBuildings({ overlay }) {
  overlay.setMap(null);
}

function addRouteLine(map, TMap, path, color, width, opacity) {
  const geometryId = `route-${nextRouteId++}`;
  return new TMap.MultiPolyline({
    map,
    geometries: [{ id: geometryId, paths: path.map((point) => toLatLng(TMap, point)), styleId: 'route' }],
    styles: {
      route: new TMap.PolylineStyle({
        color: toRgba(color, opacity),
        width,
        borderWidth: 2,
        borderColor: 'rgba(30, 27, 19, 0.9)',
        lineCap: 'round',
        showArrow: true,
        arrowOptions: { width: 12, height: 9, space: 72, align: 'middle', animSpeed: 0 }
      })
    }
  });
}

export function addRoute(map, TMap, { path, color, lineWidth, lineOpacity }) {
  return [addRouteLine(map, TMap, path, color, lineWidth, lineOpacity)];
}
