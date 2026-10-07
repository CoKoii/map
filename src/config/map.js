import vehicleModelUrl from '../assets/car.glb?url';

export const MAP_CONFIG = {
  center: [120.95, 31.34],
  zoom: 10.8,
  pitch: 43,
  rotation: 4.7,
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

export const FIXED_DISPOSAL_SITES = [
  {
    id: 'kunshan-recycling-center',
    name: '昆山建筑垃圾资源化利用中心(高新区)',
    coordinates: [120.910382, 31.452587],
    style: BUILDING_PALETTES.recyclingCenter
  },
  {
    id: 'kunshan-east-disposal-center',
    name: '昆山东部处置中心(花桥)',
    coordinates: [121.047823, 31.274948],
    style: BUILDING_PALETTES.eastDisposalCenter
  }
];

export const VEHICLE_CONFIG = {
  modelUrl: vehicleModelUrl,
  scale: 54,
  labelOffset: 38,
  pitch: MAP_CONFIG.pitch,
  forwardOffset: Math.PI / 2
};
