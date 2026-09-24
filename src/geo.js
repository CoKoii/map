const PI = Math.PI;
const AXIS = 6378245.0;
const EE = 0.00669342162296594323;

function transformLatitude(x, y) {
  let result = -100 + 2 * x + 3 * y + 0.2 * y * y + 0.1 * x * y + 0.2 * Math.sqrt(Math.abs(x));
  result += (20 * Math.sin(6 * x * PI) + 20 * Math.sin(2 * x * PI)) * 2 / 3;
  result += (20 * Math.sin(y * PI) + 40 * Math.sin(y / 3 * PI)) * 2 / 3;
  result += (160 * Math.sin(y / 12 * PI) + 320 * Math.sin(y * PI / 30)) * 2 / 3;
  return result;
}

function transformLongitude(x, y) {
  let result = 300 + x + 2 * y + 0.1 * x * x + 0.1 * x * y + 0.1 * Math.sqrt(Math.abs(x));
  result += (20 * Math.sin(6 * x * PI) + 20 * Math.sin(2 * x * PI)) * 2 / 3;
  result += (20 * Math.sin(x * PI) + 40 * Math.sin(x / 3 * PI)) * 2 / 3;
  result += (150 * Math.sin(x / 12 * PI) + 300 * Math.sin(x / 30 * PI)) * 2 / 3;
  return result;
}

function isOutsideChina([longitude, latitude]) {
  return longitude < 72.004 || longitude > 137.8347 || latitude < 0.8293 || latitude > 55.8271;
}

export function wgs84ToGcj02([longitude, latitude]) {
  if (isOutsideChina([longitude, latitude])) return [longitude, latitude];
  const deltaLatitude = transformLatitude(longitude - 105, latitude - 35);
  const deltaLongitude = transformLongitude(longitude - 105, latitude - 35);
  const latitudeRadians = latitude / 180 * PI;
  const magic = 1 - EE * Math.sin(latitudeRadians) ** 2;
  const sqrtMagic = Math.sqrt(magic);
  return [
    longitude + (deltaLongitude * 180) / (AXIS / sqrtMagic * Math.cos(latitudeRadians) * PI),
    latitude + (deltaLatitude * 180) / (AXIS * (1 - EE) / (magic * sqrtMagic) * PI)
  ];
}

function transformCoordinates(coordinates) {
  return typeof coordinates[0] === 'number'
    ? wgs84ToGcj02(coordinates)
    : coordinates.map(transformCoordinates);
}

export function transformGeoJSON(data) {
  if (data.type === 'FeatureCollection') {
    return { ...data, features: data.features.map(transformGeoJSON) };
  }
  if (data.type === 'Feature') {
    return { ...data, geometry: transformGeoJSON(data.geometry) };
  }
  return { ...data, coordinates: transformCoordinates(data.coordinates) };
}
