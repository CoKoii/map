import vehicleModelUrl from '../assets/collection-car.optimized.glb?url';

export const MAP_CONFIG = {
  center: [120.96, 31.34],
  zoom: 11.3,
  pitch: 40.5,
  rotation: 100.7,
  zooms: [9, 20],
  style: 'DARK'
};

export const INITIAL_BUILDING_SCALE = 0.025;

export const BUILDING_SPEC = {
  width: 0.006,
  depth: 0.0042,
  height: 3400,
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
  scale: 40,
  pitch: MAP_CONFIG.pitch,
  forwardOffset: Math.PI / 2
};
