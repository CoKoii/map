import * as THREE from 'three';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';
import { VEHICLE_CONFIG } from '../config/map';
import { getRouteSampler } from '../utils/coordinates';

function getMapPixel(map, AMap, coordinate) {
  const lngLat = new AMap.LngLat(coordinate[0], coordinate[1]);
  const pixel = map.lngLatToContainer?.(lngLat) || map.lngLatToPixel?.(lngLat, map.getZoom?.());
  if (!pixel) return null;
  if (Array.isArray(pixel)) return pixel;
  return [pixel.x, pixel.y];
}

function disposeObject(root) {
  root.traverse((node) => {
    if (!node.isMesh) return;
    node.geometry?.dispose();
    const materials = Array.isArray(node.material) ? node.material : [node.material];
    materials.forEach((material) => material?.dispose());
  });
}

export function loadVehicleAnimation(AMap, map, canvas, routes, vehicleIcon, options = {}) {
  const { loop = true, onComplete, removeCanvas = false, removeVehicleIcon = false } = options;
  const samplers = routes.map(({ path }) => getRouteSampler(path)).filter(({ totalDistance }) => totalDistance > 0);
  if (!canvas || !samplers.length) {
    return {
      cleanup: () => {
        if (removeCanvas) canvas?.remove();
        if (removeVehicleIcon) vehicleIcon?.remove();
      },
      ready: Promise.resolve(false)
    };
  }

  const renderer = new THREE.WebGLRenderer({ canvas, alpha: true, antialias: true, powerPreference: 'high-performance' });
  renderer.outputColorSpace = THREE.SRGBColorSpace;
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
  const scene = new THREE.Scene();
  const camera = new THREE.OrthographicCamera(0, canvas.clientWidth, canvas.clientHeight, 0, -1000, 1000);
  const vehicleRoot = new THREE.Group();
  vehicleRoot.rotation.x = THREE.MathUtils.degToRad(-VEHICLE_CONFIG.pitch);
  const ambientLight = new THREE.HemisphereLight(0xffffff, 0x182a2e, 2.3);
  const keyLight = new THREE.DirectionalLight(0xffe7a5, 3.5);
  keyLight.position.set(-200, -300, 500);
  scene.add(ambientLight, keyLight, vehicleRoot);

  let vehicle;
  let frameId;
  let stopped = false;
  let routeIndex = 0;
  let direction = 1;
  let legStartedAt;
  let resizeObserver;
  let fadePromise;

  if (vehicleIcon) vehicleIcon.style.display = 'none';

  const resize = () => {
    const width = canvas.clientWidth || canvas.parentElement.clientWidth;
    const height = canvas.clientHeight || canvas.parentElement.clientHeight;
    renderer.setSize(width, height, false);
    camera.right = width;
    camera.top = height;
    camera.bottom = 0;
    camera.updateProjectionMatrix();
  };
  resize();
  if (typeof ResizeObserver !== 'undefined') {
    resizeObserver = new ResizeObserver(resize);
    resizeObserver.observe(canvas);
  }

  const setVehicleTransform = (sampler, progress, travelDirection) => {
    const point = sampler.sample(progress);
    const nextPoint = sampler.sample(Math.min(1, progress + 0.003));
    const screenPoint = getMapPixel(map, AMap, point);
    const screenNextPoint = getMapPixel(map, AMap, nextPoint);
    if (!screenPoint || !screenNextPoint) return;
    vehicleRoot.position.set(screenPoint[0], canvas.clientHeight - screenPoint[1], 0);
    const angle = Math.atan2(screenPoint[1] - screenNextPoint[1], screenNextPoint[0] - screenPoint[0]);
    const rotation = angle + VEHICLE_CONFIG.forwardOffset + (travelDirection === -1 ? Math.PI : 0);
    vehicleRoot.rotation.z = rotation;
    if (vehicleIcon) {
      vehicleIcon.style.left = `${screenPoint[0]}px`;
      vehicleIcon.style.top = `${screenPoint[1] - VEHICLE_CONFIG.iconLift}px`;
      vehicleIcon.style.transform = 'translate(-50%, -50%)';
      vehicleIcon.style.display = 'grid';
    }
  };

  const cleanup = () => {
    stopped = true;
    if (frameId) window.cancelAnimationFrame(frameId);
    resizeObserver?.disconnect();
    if (vehicleIcon) vehicleIcon.style.display = 'none';
    disposeObject(vehicleRoot);
    vehicleRoot.clear();
    renderer.dispose();
    if (removeCanvas) canvas.remove();
    if (removeVehicleIcon) vehicleIcon?.remove();
  };

  const fadeOut = (duration = 700) => {
    if (fadePromise) return fadePromise;
    if (stopped || !vehicle) {
      cleanup();
      return Promise.resolve();
    }

    const materials = [];
    vehicle.traverse((node) => {
      if (!node.isMesh) return;
      const nodeMaterials = Array.isArray(node.material) ? node.material : [node.material];
      nodeMaterials.forEach((material) => {
        if (!material) return;
        material.transparent = true;
        materials.push(material);
      });
    });

    fadePromise = new Promise((resolve) => {
      const startedAt = performance.now();
      const tick = (now) => {
        if (stopped) {
          resolve();
          return;
        }
        const progress = Math.min(1, (now - startedAt) / duration);
        const eased = 1 - (1 - progress) ** 3;
        const opacity = 1 - eased;
        vehicleRoot.scale.setScalar(opacity);
        materials.forEach((material) => { material.opacity = opacity; });
        renderer.render(scene, camera);
        if (progress < 1) {
          frameId = window.requestAnimationFrame(tick);
          return;
        }
        cleanup();
        resolve();
      };
      frameId = window.requestAnimationFrame(tick);
    });
    return fadePromise;
  };

  const ready = new Promise((resolve, reject) => {
    const loader = new GLTFLoader();
    loader.load(VEHICLE_CONFIG.modelUrl, (gltf) => {
      if (stopped) {
        resolve(false);
        return;
      }
      vehicle = gltf.scene;
      vehicle.scale.setScalar(VEHICLE_CONFIG.scale);
      vehicle.rotation.set(Math.PI / 2, 0, 0);
      vehicle.traverse((node) => {
        if (!node.isMesh) return;
        node.castShadow = false;
        node.receiveShadow = false;
      });
      vehicleRoot.add(vehicle);
      const animate = (now) => {
        if (stopped || !vehicle) return;
        const sampler = samplers[routeIndex];
        const elapsed = (now - legStartedAt) / VEHICLE_CONFIG.legDuration;
        const progress = direction === 1 ? Math.min(1, elapsed) : 1 - Math.min(1, elapsed);
        setVehicleTransform(sampler, progress, direction);
        renderer.render(scene, camera);
        if (elapsed >= 1) {
          if (!loop) {
            onComplete?.();
            return;
          }
          if (direction === 1) direction = -1;
          else {
            direction = 1;
            routeIndex = (routeIndex + 1) % samplers.length;
          }
          legStartedAt = now;
        }
        frameId = window.requestAnimationFrame(animate);
      };
      legStartedAt = performance.now();
      frameId = window.requestAnimationFrame(animate);
      resolve(true);
    }, undefined, reject);
  });

  ready.catch((error) => {
    cleanup();
    console.info('3D vehicle model initialization failed', error);
  });
  return { cleanup, fadeOut, ready };
}
