export function toCoordinate(point) {
  if (Array.isArray(point)) return point.slice(0, 2);
  if (typeof point?.toArray === 'function') return point.toArray().slice(0, 2);
  if (typeof point?.getLng === 'function' && typeof point?.getLat === 'function') {
    return [point.getLng(), point.getLat()];
  }
  return null;
}

export function distanceMeters(from, to) {
  const latitude = ((from[1] + to[1]) / 2 * Math.PI) / 180;
  const longitudeMeters = 111320 * Math.cos(latitude);
  const latitudeMeters = 110540;
  return Math.hypot((to[0] - from[0]) * longitudeMeters, (to[1] - from[1]) * latitudeMeters);
}

const routeMetricsCache = new WeakMap();

function createRouteMetrics(path) {
  const cached = routeMetricsCache.get(path);
  if (cached) return cached;

  const points = path.map(toCoordinate).filter(Boolean);
  const cumulative = [0];
  for (let index = 1; index < points.length; index += 1) {
    cumulative.push(cumulative[index - 1] + distanceMeters(points[index - 1], points[index]));
  }
  const metrics = { points, cumulative, totalDistance: cumulative.at(-1) || 0 };
  routeMetricsCache.set(path, metrics);
  return metrics;
}

export function getRoutePrefix(path, progress) {
  const { points, cumulative, totalDistance } = createRouteMetrics(path);
  if (points.length <= 1) return points;
  if (totalDistance === 0) return [points[0]];
  const normalizedProgress = Math.max(0, Math.min(1, progress));
  if (normalizedProgress <= 0) return [points[0]];
  if (normalizedProgress >= 1) return points;

  const distance = normalizedProgress * totalDistance;
  let index = cumulative.findIndex((value) => value >= distance);
  if (index < 1) index = 1;
  const segmentDistance = cumulative[index] - cumulative[index - 1] || 1;
  const segmentProgress = (distance - cumulative[index - 1]) / segmentDistance;
  if (segmentProgress <= 1e-8) return points.slice(0, index);
  const from = points[index - 1];
  const to = points[index];
  const interpolated = [
    from[0] + (to[0] - from[0]) * segmentProgress,
    from[1] + (to[1] - from[1]) * segmentProgress
  ];

  return [...points.slice(0, index), interpolated];
}

export function getRouteSampler(path) {
  const { points, cumulative, totalDistance } = createRouteMetrics(path);

  return {
    totalDistance,
    sample(progress) {
      if (points.length === 1 || totalDistance === 0) return points[0];
      const distance = Math.max(0, Math.min(totalDistance, progress * totalDistance));
      let index = cumulative.findIndex((value) => value >= distance);
      if (index < 1) index = 1;
      const segmentDistance = cumulative[index] - cumulative[index - 1] || 1;
      const segmentProgress = (distance - cumulative[index - 1]) / segmentDistance;
      const from = points[index - 1];
      const to = points[index];
      return [from[0] + (to[0] - from[0]) * segmentProgress, from[1] + (to[1] - from[1]) * segmentProgress];
    }
  };
}
