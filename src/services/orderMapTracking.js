import { addRoute } from './mapOverlays';
import { createOrderBuildings } from './orderBuildings';

const ROUTE_COLORS = ['#58f2c7', '#ffe45e', '#47d7ff', '#ff8b62'];
const COMPLETED_STATUSES = new Set(['10013040', '10013160', '10013180']);

function validCoordinate(track) {
  const lng = Number(track.lng);
  const lat = Number(track.lat);
  return Number.isFinite(lng) && Number.isFinite(lat) && lng >= 73 && lng <= 135 && lat >= 18 && lat <= 54
    ? [lng, lat]
    : null;
}

function validOrderCoordinate(point) {
  const coordinate = validCoordinate(point);
  if (!coordinate) return null;
  const [lng, lat] = coordinate;
  return lng >= 119 && lng <= 123 && lat >= 29 && lat <= 33 ? coordinate : null;
}

function isCompleted(order) {
  const status = String(order.realtimeTrack.status);
  return COMPLETED_STATUSES.has(status) || /已完成|交易完成|到场回执/.test(order.status);
}

function normalizeTrack(points) {
  return points.reduce((path, point) => {
    const coordinate = validCoordinate(point);
    const previous = path[path.length - 1];
    if (coordinate && (coordinate[0] !== previous?.[0] || coordinate[1] !== previous?.[1])) {
      path.push(coordinate);
    }
    return path;
  }, []);
}

function getRouteColor(orderId) {
  let hash = 0;
  for (const character of String(orderId)) hash = (hash * 31 + character.charCodeAt(0)) >>> 0;
  return ROUTE_COLORS[hash % ROUTE_COLORS.length];
}

export function createOrderMapTracking({ TMap, map }) {
  const buildings = createOrderBuildings({ TMap, map });
  const routeOverlays = new Map();
  let vehiclePositions = [];

  const removeRoute = (id) => {
    routeOverlays.get(id)?.overlays.forEach((overlay) => overlay.setMap(null));
    routeOverlays.delete(id);
  };

  const clearRoutes = () => {
    routeOverlays.forEach(({ overlays }) => overlays.forEach((overlay) => overlay.setMap(null)));
    routeOverlays.clear();
  };

  const samePath = (left, right) => left.length === right.length
    && left.every(([longitude, latitude], index) => (
      longitude === right[index][0] && latitude === right[index][1]
    ));

  const syncRoutes = (orders) => {
    const desiredIds = new Set();

    orders.forEach(({ id, fullPath, color }) => {
      if (fullPath.length < 2) return;
      desiredIds.add(id);
      const current = routeOverlays.get(id);
      if (current?.color === color && samePath(current.path, fullPath)) return;

      removeRoute(id);
      routeOverlays.set(id, {
        color,
        path: fullPath,
        overlays: addRoute(map, TMap, {
          path: fullPath,
          color,
          lineWidth: 5,
          lineOpacity: 1
        })
      });
    });

    routeOverlays.forEach((_, id) => {
      if (!desiredIds.has(id)) removeRoute(id);
    });
  };

  const update = (orders) => {
    const mapped = orders.map((order) => {
      const { realtimeTrack } = order;
      const realtimePath = normalizeTrack(realtimeTrack.realtimeData);
      const fullPath = normalizeTrack(realtimeTrack.allRouteData);
      const id = order.orderNo;
      return {
        id,
        order,
        realtimePath,
        fullPath,
        startCoordinate: validOrderCoordinate(realtimeTrack.startPoint),
        endCoordinate: validOrderCoordinate(realtimeTrack.endPoint),
        coordinate: realtimePath.at(-1),
        color: getRouteColor(order.orderNo),
        completed: isCompleted(order)
      };
    });

    const activeOrders = mapped.filter(({ completed }) => !completed);
    buildings.update(activeOrders.filter(({ fullPath }) => fullPath.length > 1)
      .flatMap(({ id, order, startCoordinate, endCoordinate, color }) => [
        {
          id: `${id}:start`,
          name: order.realtimeTrack.startPoint.name,
          coordinate: startCoordinate,
          color
        },
        {
          id: `${id}:end`,
          name: order.realtimeTrack.endPoint.name,
          coordinate: endCoordinate,
          color
        }
      ]));

    syncRoutes(activeOrders);

    vehiclePositions = activeOrders.filter(({ realtimePath }) => realtimePath.length > 1).map(({ id, coordinate, realtimePath }) => {
      const previous = realtimePath[realtimePath.length - 2];
      return {
        id,
        coordinate,
        nextCoordinate: [coordinate[0] + (coordinate[0] - previous[0]), coordinate[1] + (coordinate[1] - previous[1])]
      };
    });
  };

  return {
    update,
    getVehiclePositions: () => vehiclePositions,
    cleanup() {
      clearRoutes();
      buildings.cleanup();
      vehiclePositions = [];
    }
  };
}
