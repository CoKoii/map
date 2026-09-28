import { addRoute, setRouteProgress } from './mapOverlays';

const MAX_TRACK_POINTS = 120;
const ROUTE_COLORS = ['#70e0c0', '#ffd477', '#67c7ec', '#f59d72'];

function validCoordinate(track) {
  const lng = Number(track?.lng);
  const lat = Number(track?.lat);
  return Number.isFinite(lng) && Number.isFinite(lat) && lng >= 73 && lng <= 135 && lat >= 18 && lat <= 54
    ? [lng, lat]
    : null;
}

function distanceSquared(left, right) {
  return (left[0] - right[0]) ** 2 + (left[1] - right[1]) ** 2;
}

function escapeXml(value) {
  return String(value).replace(/[<>&"']/g, (character) => ({ '<': '&lt;', '>': '&gt;', '&': '&amp;', '"': '&quot;', "'": '&apos;' })[character]);
}

function markerImage(order, color) {
  const plate = escapeXml(order.vehiclePlate || order.orderNo || '车辆');
  const status = escapeXml(order.status || '状态未知');
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="156" height="62" viewBox="0 0 156 62"><rect x="1" y="1" width="154" height="34" rx="7" fill="#0b2024" fill-opacity=".96" stroke="${color}"/><text x="78" y="15" fill="#fff0c5" font-family="sans-serif" font-size="11" text-anchor="middle">${plate}</text><text x="78" y="29" fill="#a9c4b7" font-family="sans-serif" font-size="9" text-anchor="middle">${status}</text><path d="M78 35v8" stroke="${color}" stroke-width="1.5"/><circle cx="78" cy="51" r="9" fill="#102c32" stroke="${color}" stroke-width="2"/><path d="M72 52v-4h7l3 3v3h-1a2 2 0 0 0-4 0h-2a2 2 0 0 0-4 0h-1v-2zm8-3v2h2l-2-2zm-6 4a1 1 0 1 1 2 0 1 1 0 0 1-2 0zm6 0a1 1 0 1 1 2 0 1 1 0 0 1-2 0z" fill="${color}"/></svg>`;
  return `data:image/svg+xml;charset=UTF-8,${encodeURIComponent(svg)}`;
}

export function createOrderMapTracking({ TMap, map }) {
  const histories = new Map();
  let markerOverlay;
  let routeOverlays = [];
  let latestVehiclePosition = null;

  const clearOverlays = () => {
    markerOverlay?.setMap?.(null);
    markerOverlay = null;
    routeOverlays.forEach((overlay) => overlay.setMap?.(null));
    routeOverlays = [];
  };

  const update = (orders = []) => {
    const validOrders = orders.map((order) => ({ order, coordinate: validCoordinate(order.realtimeTrack) }))
      .filter(({ coordinate }) => coordinate);
    const currentIds = new Set(validOrders.map(({ order }) => order.orderNo).filter(Boolean));
    histories.forEach((_, orderNo) => {
      if (!currentIds.has(orderNo)) histories.delete(orderNo);
    });

    const mapped = validOrders.map(({ order, coordinate }, index) => {
      const key = order.orderNo || `order-${index}`;
      const path = histories.get(key) || [];
      if (!path.length || distanceSquared(path[path.length - 1], coordinate) > 1e-12) {
        path.push(coordinate);
        if (path.length > MAX_TRACK_POINTS) path.shift();
      }
      histories.set(key, path);
      return { order, coordinate, path, color: ROUTE_COLORS[index % ROUTE_COLORS.length] };
    });

    clearOverlays();
    if (mapped.length) {
      const styles = {};
      const geometries = mapped.map(({ order, coordinate, color }, index) => {
        const styleId = `order-${index}`;
        styles[styleId] = new TMap.MarkerStyle({
          width: 156,
          height: 62,
          anchor: new TMap.Point(78, 60),
          src: markerImage(order, color)
        });
        return { id: order.orderNo || `order-${index}`, position: new TMap.LatLng(coordinate[1], coordinate[0]), styleId };
      });
      markerOverlay = new TMap.MultiMarker({ map, styles, geometries });

      mapped.filter(({ path }) => path.length > 1).forEach(({ path, color }) => {
        const overlays = addRoute(map, TMap, { path, color });
        setRouteProgress(overlays, path, 1);
        routeOverlays.push(...overlays);
      });
    }

    const latest = mapped
      .filter(({ path }) => path.length)
      .sort((left, right) => String(right.order.realtimeTrack?.updateTime || '').localeCompare(String(left.order.realtimeTrack?.updateTime || '')))[0];
    if (!latest) {
      latestVehiclePosition = null;
      return;
    }

    const previous = latest.path.length > 1 ? latest.path[latest.path.length - 2] : null;
    const point = latest.coordinate;
    latestVehiclePosition = {
      coordinate: point,
      nextCoordinate: previous ? [point[0] + (point[0] - previous[0]), point[1] + (point[1] - previous[1])] : [point[0] + 0.00001, point[1]]
    };
  };

  return {
    update,
    getVehiclePosition: () => latestVehiclePosition,
    cleanup() {
      clearOverlays();
      histories.clear();
      latestVehiclePosition = null;
    }
  };
}
