import { BUILDING_PALETTES, INITIAL_BUILDING_SCALE } from '../config/map';
import { addPlaceBuildings, addPlaceHighlight, addRoute, removePlaceBuildings, setBuildingScale, setRouteProgress } from './mapOverlays';
import { getRoutePath } from './mapData';
import { loadVehicleAnimation } from './vehicleAnimation';

const BUILDING_RISE_DURATION = 1400;
const ROUTE_DRAW_DURATION = 900;
const ARRIVAL_PAUSE = 300;
const CLEANUP_DURATION = 900;
const MAX_ACTIVE_TRANSACTIONS = 2;
const NEXT_TRANSACTION_MIN_DELAY = 1200;
const NEXT_TRANSACTION_MAX_DELAY = 3200;
const OVERLAY_FRAME_INTERVAL = 1000 / 30;

function wait(milliseconds) {
  return new Promise((resolve) => window.setTimeout(resolve, milliseconds));
}

function createVehicleCanvas(templateCanvas) {
  const canvas = document.createElement('canvas');
  canvas.className = templateCanvas?.className || 'vehicle-layer';
  canvas.setAttribute('aria-hidden', 'true');
  templateCanvas?.parentElement?.append(canvas);
  return canvas;
}

function createVehicleIcon(templateIcon) {
  if (!templateIcon) return null;
  const icon = templateIcon.cloneNode(true);
  icon.removeAttribute('id');
  icon.style.display = 'none';
  templateIcon.parentElement?.append(icon);
  return icon;
}

function choosePair(places) {
  if (places.length < 2) return null;
  const originIndex = Math.floor(Math.random() * places.length);
  let destinationIndex = Math.floor(Math.random() * places.length);
  while (destinationIndex === originIndex) destinationIndex = Math.floor(Math.random() * places.length);
  return [places[originIndex], places[destinationIndex]];
}

function randomDelay() {
  return NEXT_TRANSACTION_MIN_DELAY + Math.random() * (NEXT_TRANSACTION_MAX_DELAY - NEXT_TRANSACTION_MIN_DELAY);
}

function animateProgress(from, to, duration, isStopped, update) {
  return new Promise((resolve) => {
    const startedAt = performance.now();
    let lastAppliedAt = -Infinity;
    const tick = (now) => {
      if (isStopped()) {
        resolve();
        return;
      }
      const progress = Math.min(1, (now - startedAt) / duration);
      const eased = 1 - (1 - progress) ** 3;
      if (now - lastAppliedAt >= OVERLAY_FRAME_INTERVAL || progress >= 1) {
        update(from + (to - from) * eased);
        lastAppliedAt = now;
      }
      if (progress < 1) window.requestAnimationFrame(tick);
      else resolve();
    };
    window.requestAnimationFrame(tick);
  });
}

function animateRoute(routeOverlays, path, from, to, duration, isStopped) {
  return animateProgress(from, to, duration, isStopped, (progress) => setRouteProgress(routeOverlays, path, progress));
}

export function createTransactionSimulation({ AMap, map, places, routes, canvas, vehicleIcon }) {
  const availablePlaces = places.filter((place) => place.coordinates?.length === 2);
  let stopped = false;
  let spawnTimer;
  const activeTransactions = new Set();
  const placeVisuals = new Map();

  const clearTransactionOverlays = (transaction) => {
    transaction.routeOverlays?.filter(Boolean).forEach((overlay) => overlay.setMap?.(null));
  };

  const animatePlaceBuildings = (visual, target, duration) => {
    if (!visual.buildings.length) return Promise.resolve();
    if (visual.animationTarget === target && visual.animationPromise) return visual.animationPromise;
    if (Math.abs(visual.scale - target) < 0.001) {
      visual.animationTarget = target;
      return Promise.resolve();
    }

    const animationVersion = visual.animationVersion + 1;
    const from = visual.scale;
    visual.animationVersion = animationVersion;
    visual.animationTarget = target;
    const animation = animateProgress(
      from,
      target,
      duration,
      () => stopped || visual.animationVersion !== animationVersion,
      (scale) => {
        visual.scale = scale;
        setBuildingScale(visual.buildings, scale);
      }
    );
    visual.animationPromise = animation.then(() => {
      if (visual.animationVersion === animationVersion) {
        visual.scale = target;
        visual.animationPromise = null;
      }
    });
    return visual.animationPromise;
  };

  const retainPlace = (place) => {
    let visual = placeVisuals.get(place.id);
    if (!visual) {
      const [marker] = addPlaceHighlight(map, AMap, place, place.coordinates);
      visual = {
        place,
        marker,
        buildings: [],
        references: 0,
        scale: INITIAL_BUILDING_SCALE,
        animationVersion: 0,
        animationTarget: null,
        animationPromise: null
      };
      placeVisuals.set(place.id, visual);
    }
    visual.references += 1;
    return visual;
  };

  const ensurePlaceBuildings = (visual) => {
    if (!visual.buildings.length) {
      visual.buildings = addPlaceBuildings(map, AMap, visual.place.coordinates, BUILDING_PALETTES[visual.place.buildingPalette]);
      visual.scale = INITIAL_BUILDING_SCALE;
    }
    return animatePlaceBuildings(visual, 1, BUILDING_RISE_DURATION);
  };

  const disposePlaceVisual = (visual) => {
    visual.animationVersion += 1;
    visual.animationPromise = null;
    removePlaceBuildings(visual.buildings);
    visual.marker?.setMap?.(null);
    placeVisuals.delete(visual.place.id);
  };

  const releasePlace = (visual) => {
    visual.references = Math.max(0, visual.references - 1);
    if (visual.references > 0) return Promise.resolve();
    if (!visual.buildings.length) {
      disposePlaceVisual(visual);
      return Promise.resolve();
    }

    return animatePlaceBuildings(visual, 0, CLEANUP_DURATION).then(() => {
      if (visual.references === 0 && visual.animationTarget === 0) disposePlaceVisual(visual);
    });
  };

  const finishTransaction = async (transaction) => {
    if (stopped || !activeTransactions.has(transaction) || transaction.finished) return;
    transaction.finished = true;
    await wait(ARRIVAL_PAUSE);
    if (stopped || !activeTransactions.has(transaction)) return;
    await Promise.all([
      animateRoute(transaction.routeOverlays, transaction.path, 1, 0, CLEANUP_DURATION, () => stopped),
      transaction.vehicleAnimation?.fadeOut?.(CLEANUP_DURATION) || Promise.resolve(),
      ...transaction.placeVisuals.map((visual) => releasePlace(visual))
    ]);
    if (stopped || !activeTransactions.has(transaction)) return;
    clearTransactionOverlays(transaction);
    activeTransactions.delete(transaction);
  };

  const startTransaction = async () => {
    if (stopped || activeTransactions.size >= MAX_ACTIVE_TRANSACTIONS) return;
    const pair = choosePair(availablePlaces);
    if (!pair) return;
    const [origin, destination] = pair;
    const transaction = { origin, destination, placeVisuals: [], routeOverlays: [] };
    activeTransactions.add(transaction);
    transaction.placeVisuals = [
      retainPlace(origin),
      retainPlace(destination)
    ];

    const path = getRoutePath(routes, origin.id, destination.id, [origin.coordinates, destination.coordinates]);
    await Promise.all(transaction.placeVisuals.map(ensurePlaceBuildings));
    if (stopped || !activeTransactions.has(transaction)) return;

    transaction.path = path;
    transaction.routeOverlays = addRoute(map, AMap, { path, color: origin.color });
    await animateRoute(transaction.routeOverlays, path, 0, 1, ROUTE_DRAW_DURATION, () => stopped);
    if (stopped || !activeTransactions.has(transaction)) return;
    if (stopped || !activeTransactions.has(transaction)) return;
    const vehicleCanvas = createVehicleCanvas(canvas);
    const transactionVehicleIcon = createVehicleIcon(vehicleIcon);
    transaction.vehicleAnimation = loadVehicleAnimation(AMap, map, vehicleCanvas, [{ path }], transactionVehicleIcon, {
      loop: false,
      removeCanvas: true,
      removeVehicleIcon: true,
      onComplete: () => finishTransaction(transaction)
    });
    transaction.vehicleAnimation.ready.then((ready) => {
      if (!ready && !transaction.finished) finishTransaction(transaction);
    }).catch(() => finishTransaction(transaction));
  };

  const scheduleNextTransaction = (delay = randomDelay()) => {
    if (stopped) return;
    spawnTimer = window.setTimeout(() => {
      startTransaction();
      scheduleNextTransaction();
    }, delay);
  };

  const start = () => {
    scheduleNextTransaction(700 + Math.random() * 700);
  };

  const cleanup = () => {
    stopped = true;
    if (spawnTimer) window.clearTimeout(spawnTimer);
    activeTransactions.forEach((transaction) => {
      transaction.vehicleAnimation?.cleanup();
      clearTransactionOverlays(transaction);
    });
    placeVisuals.forEach(disposePlaceVisual);
    activeTransactions.clear();
  };

  return { start, cleanup };
}
