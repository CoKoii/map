import vehicleModelUrl from '../assets/collection-car.optimized.glb?url';

export const MAP_CONFIG = {
  center: [120.98, 31.35],
  zoom: 12.4,
  pitch: 40.5,
  rotation: 100.7,
  zooms: [9, 20],
  style: 'amap://styles/dark'
};

export const POINT_MARKER_LIFT = 72;
export const INITIAL_BUILDING_SCALE = 0.025;

export const BUILDING_SPECS = [
  { x: -0.009, y: 0.0065, width: 0.0064, depth: 0.0042, height: 3000, eastScale: 0.72, northScale: 0.58 },
  { x: 0.009, y: 0.006, width: 0.0046, depth: 0.0036, height: 2100, eastScale: 0.92, northScale: 0.78 },
  { x: -0.007, y: -0.007, width: 0.0085, depth: 0.0032, height: 850, eastScale: 0.65, northScale: 0.92 },
  { x: 0.008, y: -0.0062, width: 0.0032, depth: 0.0054, height: 450, eastScale: 0.82, northScale: 0.5 }
];

export const BUILDING_PALETTES = {
  recyclingCenter: [
    { fillColor: '#f4c65f', wallColor: '#a96029', roofColor: '#ffe7a0' },
    { fillColor: '#e3a447', wallColor: '#88491f', roofColor: '#ffd078' },
    { fillColor: '#c98232', wallColor: '#6c391b', roofColor: '#f1b65b' },
    { fillColor: '#f0d47b', wallColor: '#95702d', roofColor: '#fff0b1' }
  ],
  eastDisposalCenter: [
    { fillColor: '#f28b55', wallColor: '#8f422d', roofColor: '#ffc095' },
    { fillColor: '#df7045', wallColor: '#713426', roofColor: '#f5a174' },
    { fillColor: '#c95c39', wallColor: '#57271f', roofColor: '#e8815c' },
    { fillColor: '#f5a06e', wallColor: '#8e4c32', roofColor: '#ffd1ae' }
  ],
  huaqiao: [
    { fillColor: '#55c5d8', wallColor: '#216477', roofColor: '#a1edf2' },
    { fillColor: '#42aebe', wallColor: '#1a5367', roofColor: '#7edce5' },
    { fillColor: '#318fa7', wallColor: '#123f52', roofColor: '#66c8d4' },
    { fillColor: '#75d6e2', wallColor: '#286d7c', roofColor: '#c0f6f5' }
  ]
};

export const VEHICLE_CONFIG = {
  modelUrl: vehicleModelUrl,
  scale: 58,
  pitch: MAP_CONFIG.pitch,
  legDuration: 18000,
  forwardOffset: Math.PI / 2,
  iconLift: 42
};
