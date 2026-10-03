import { BUILDING_PALETTES, INITIAL_BUILDING_SCALE } from '../config/map';
import { addPlaceBuildings, addPlaceHighlight, removePlaceBuildings, setBuildingScale } from './mapOverlays';

const APPEAR_DURATION = 900;
const BUILDING_STYLES = Object.values(BUILDING_PALETTES);

export function createOrderBuildings({ TMap, map }) {
  const visuals = new Map();
  let stopped = false;

  const cancelAnimation = (visual) => {
    visual.animationToken += 1;
    if (visual.frameId !== null) window.cancelAnimationFrame(visual.frameId);
    visual.frameId = null;
  };

  const destroy = (key, visual) => {
    cancelAnimation(visual);
    visual.marker.setMap(null);
    removePlaceBuildings(visual.buildings);
    if (visuals.get(key) === visual) visuals.delete(key);
  };

  const animate = (key, visual, target, duration, onComplete) => {
    cancelAnimation(visual);
    const token = visual.animationToken;
    const startScale = visual.scale;
    const startedAt = performance.now();
    const tick = (now) => {
      if (stopped || visuals.get(key) !== visual || token !== visual.animationToken) return;
      const progress = Math.min(1, (now - startedAt) / duration);
      const eased = 1 - (1 - progress) ** 3;
      visual.scale = startScale + (target - startScale) * eased;
      setBuildingScale(visual.buildings, visual.scale);
      if (progress < 1) {
        visual.frameId = window.requestAnimationFrame(tick);
        return;
      }
      visual.frameId = null;
      onComplete?.();
    };
    visual.frameId = window.requestAnimationFrame(tick);
  };

  const create = ({ id, name, coordinate }, index) => {
    const place = {
      id: `order-${id}`,
      name,
      coordinates: coordinate
    };
    const marker = addPlaceHighlight(map, TMap, place, coordinate);
    const style = BUILDING_STYLES[index % BUILDING_STYLES.length];
    const buildings = addPlaceBuildings(map, TMap, coordinate, style);
    setBuildingScale(buildings, INITIAL_BUILDING_SCALE);
    return { marker, buildings, scale: INITIAL_BUILDING_SCALE, animationToken: 0, frameId: null, place };
  };

  return {
    update(items) {
      if (stopped) return;
      const desired = new Map(items.filter((item) => item.coordinate).map((item) => [String(item.id), item]));

      desired.forEach((item, key) => {
        let visual = visuals.get(key);
        const changed = visual && (visual.place.name !== item.name
          || visual.place.coordinates[0] !== item.coordinate[0]
          || visual.place.coordinates[1] !== item.coordinate[1]);
        if (changed) {
          destroy(key, visual);
          visual = null;
        }
        if (!visual) {
          visual = create({ ...item, id: key }, visuals.size);
          visuals.set(key, visual);
          animate(key, visual, 1, APPEAR_DURATION);
        }
      });

      visuals.forEach((visual, key) => {
        if (desired.has(key)) return;
        destroy(key, visual);
      });
    },
    cleanup() {
      stopped = true;
      visuals.forEach((visual, key) => destroy(key, visual));
    }
  };
}
