import vehicleModelUrl from '../assets/car.glb?url';

export const MAP_CONFIG = {
  center: [120.96, 31.34],
  zoom: 11.3,
  pitch: 40.5,
  rotation: 100.7,
  zooms: [9, 20],
  style: 'DARK'
};

export const INITIAL_BUILDING_SCALE = 0.025;
export const ROTATION_INTERVAL = 2000;
export const ROUTE_ROTATION_INTERVAL = 10000;

export const BUILDING_SPEC = {
  width: 0.009,
  depth: 0.0064,
  height: 5200,
  eastScale: 0.82,
  northScale: 0.64
};

export const BUILDING_PALETTES = {
  recyclingCenter: { fillColor: '#f4c65f', roofColor: '#ffe7a0' },
  eastDisposalCenter: { fillColor: '#f28b55', roofColor: '#ffc095' },
  huaqiao: { fillColor: '#55c5d8', roofColor: '#a1edf2' }
};

export const VEHICLE_CONFIG = {
  modelUrl: vehicleModelUrl,
  scale: 54,
  pitch: MAP_CONFIG.pitch,
  forwardOffset: Math.PI / 2
};
