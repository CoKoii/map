import { addRoute } from './mapOverlays';
import { createOrderBuildings } from './orderBuildings';
import { ROUTE_ROTATION_INTERVAL } from '../config/map';

const ROUTE_COLOR = '#ffd477';
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

export function createOrderMapTracking({ TMap, map, onChange }) {
  const buildings = createOrderBuildings({ TMap, map });
  let routeOverlay;
  let activeOrders = [];
  let activeIndex = 0;
  let vehiclePositions = [];
  let rotationTimer;

  const clearRoute = () => {
    routeOverlay?.overlays.forEach((overlay) => overlay.setMap(null));
    routeOverlay = undefined;
  };

  const samePath = (left, right) => left.length === right.length
    && left.every(([longitude, latitude], index) => (
      longitude === right[index][0] && latitude === right[index][1]
    ));

  const syncRoute = (order) => {
    if (!order || order.fullPath.length < 2) {
      clearRoute();
      return;
    }
    if (routeOverlay?.id === order.id && samePath(routeOverlay.path, order.fullPath)) return;

    clearRoute();
    routeOverlay = {
      id: order.id,
      path: order.fullPath,
      overlays: addRoute(map, TMap, {
        path: order.fullPath,
        color: ROUTE_COLOR,
        lineWidth: 5,
        lineOpacity: 1
      })
    };
  };

  const showActiveOrder = () => {
    const order = activeOrders[activeIndex];
    if (!order) {
      syncRoute(null);
      buildings.update([]);
      vehiclePositions = [];
      onChange(null);
      return;
    }

    syncRoute(order);
    buildings.update([
      {
        id: `${order.id}:start`,
        name: order.order.realtimeTrack.startPoint.name,
        coordinate: order.startCoordinate
      },
      {
        id: `${order.id}:end`,
        name: order.order.realtimeTrack.endPoint.name,
        coordinate: order.endCoordinate
      }
    ]);
    vehiclePositions = order.realtimePath.length > 1 ? [{
      id: order.id,
      vehiclePlate: order.order.vehiclePlate,
      coordinate: order.coordinate,
      nextCoordinate: [
        order.coordinate[0] + order.coordinate[0] - order.realtimePath.at(-2)[0],
        order.coordinate[1] + order.coordinate[1] - order.realtimePath.at(-2)[1]
      ]
    }] : [];
    onChange(order.order);
  };

  const update = (orders) => {
    const currentOrderId = activeOrders[activeIndex]?.id;
    activeOrders = orders.map((order) => {
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
        completed: isCompleted(order)
      };
    }).filter(({ completed, fullPath }) => !completed && fullPath.length > 1);

    if (activeOrders.length > 1 && !rotationTimer) {
      rotationTimer = window.setInterval(() => {
        activeIndex = (activeIndex + 1) % activeOrders.length;
        showActiveOrder();
      }, ROUTE_ROTATION_INTERVAL);
    } else if (activeOrders.length < 2 && rotationTimer) {
      window.clearInterval(rotationTimer);
      rotationTimer = undefined;
    }

    const currentIndex = activeOrders.findIndex(({ id }) => id === currentOrderId);
    activeIndex = currentIndex === -1 ? 0 : currentIndex;
    showActiveOrder();
  };

  return {
    update,
    getVehiclePositions: () => vehiclePositions,
    cleanup() {
      window.clearInterval(rotationTimer);
      clearRoute();
      buildings.cleanup();
      activeOrders = [];
      vehiclePositions = [];
    }
  };
}
