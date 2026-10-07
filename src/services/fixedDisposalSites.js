import { FIXED_DISPOSAL_SITES } from '../config/map';
import { addDisposalFacilityBuildings, addPlaceHighlight } from './mapOverlays';

export function createFixedDisposalSites({ TMap, map }) {
  const overlays = [];
  FIXED_DISPOSAL_SITES.forEach((site) => {
    const buildings = addDisposalFacilityBuildings(map, TMap, site.coordinates, site.style);
    overlays.push(buildings.overlay);
    overlays.push(addPlaceHighlight(map, TMap, site, site.coordinates, {
      footprint: buildings.footprint,
      height: buildings.height
    }));
  });
  return () => overlays.forEach((overlay) => overlay.setMap(null));
}
