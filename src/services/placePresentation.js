import { BUILDING_PALETTES, INITIAL_BUILDING_SCALE } from '../config/map';
import { addPlaceBuildings, addPlaceHighlight, removePlaceBuildings, setBuildingScale } from './mapOverlays';

const BUILDING_RISE_DURATION = 1400;
const BUILDING_HOLD_DURATION = 3600;
const FRAME_INTERVAL = 1000 / 30;

function animateScale(visual, target, duration, isStopped) {
  const startScale = visual.scale;
  const startedAt = performance.now();
  let lastAppliedAt = -Infinity;

  return new Promise((resolve) => {
    const tick = (now) => {
      if (isStopped()) {
        resolve();
        return;
      }
      const progress = Math.min(1, (now - startedAt) / duration);
      const eased = 1 - (1 - progress) ** 3;
      if (now - lastAppliedAt >= FRAME_INTERVAL || progress >= 1) {
        visual.scale = startScale + (target - startScale) * eased;
        setBuildingScale(visual.buildings, visual.scale);
        lastAppliedAt = now;
      }
      if (progress < 1) window.requestAnimationFrame(tick);
      else resolve();
    };
    window.requestAnimationFrame(tick);
  });
}

export function createPlacePresentation({ TMap, map, places }) {
  let stopped = false;
  let cycleToken = 0;
  let holdTimer;
  let resolveHold;
  const visuals = places.map((place, index) => {
    const [marker] = addPlaceHighlight(map, TMap, place, place.coordinates);
    if (index > 0) marker.setMap(null);
    return {
      place,
      marker,
      buildings: addPlaceBuildings(map, TMap, place.coordinates, BUILDING_PALETTES[place.buildingPalette]),
      scale: INITIAL_BUILDING_SCALE
    };
  });

  const cycle = async (index) => {
    if (stopped || !visuals.length) return;
    const token = ++cycleToken;
    const visual = visuals[index];
    visual.marker.setMap(map);
    await animateScale(visual, 1, BUILDING_RISE_DURATION, () => stopped || token !== cycleToken);
    if (stopped || token !== cycleToken) return;
    await new Promise((resolve) => {
      resolveHold = resolve;
      holdTimer = window.setTimeout(() => {
        holdTimer = null;
        resolveHold = null;
        resolve();
      }, BUILDING_HOLD_DURATION);
    });
    if (stopped || token !== cycleToken) return;
    await animateScale(visual, INITIAL_BUILDING_SCALE, BUILDING_RISE_DURATION, () => stopped || token !== cycleToken);
    if (stopped || token !== cycleToken) return;
    visual.marker.setMap(null);
    void cycle((index + 1) % visuals.length);
  };

  return {
    start() {
      if (visuals.length) void cycle(0);
    },
    cleanup() {
      stopped = true;
      cycleToken += 1;
      window.clearTimeout(holdTimer);
      resolveHold?.();
      holdTimer = null;
      resolveHold = null;
      visuals.forEach(({ marker, buildings }) => {
        marker.setMap(null);
        removePlaceBuildings(buildings);
      });
    }
  };
}
