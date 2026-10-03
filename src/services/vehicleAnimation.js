import * as THREE from 'three';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';
import { MeshoptDecoder } from 'three/examples/jsm/libs/meshopt_decoder.module.js';
import { VEHICLE_CONFIG } from '../config/map';

function getMapPixel(map, TMap, coordinate) {
  const latLng = new TMap.LatLng(coordinate[1], coordinate[0]);
  const pixel = map.projectToContainer(latLng);
  return [pixel.x, pixel.y];
}

function disposeObject(root) {
  const disposed = new Set();
  root.traverse((node) => {
    if (!node.isMesh) return;
    if (node.geometry && !disposed.has(node.geometry)) {
      node.geometry.dispose();
      disposed.add(node.geometry);
    }
    const materials = Array.isArray(node.material) ? node.material : [node.material];
    materials.forEach((material) => {
      if (!material || disposed.has(material)) return;
      Object.values(material).forEach((value) => {
        if (value?.isTexture && !disposed.has(value)) {
          value.dispose();
          disposed.add(value);
        }
      });
      material.dispose();
      disposed.add(material);
    });
  });
}

export function loadVehicleAnimation(TMap, map, canvas, positionProvider) {
  const renderer = new THREE.WebGLRenderer({ canvas, alpha: true, antialias: true, powerPreference: 'high-performance' });
  renderer.outputColorSpace = THREE.SRGBColorSpace;
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
  const scene = new THREE.Scene();
  const camera = new THREE.OrthographicCamera(0, canvas.clientWidth, canvas.clientHeight, 0, -1000, 1000);
  const ambientLight = new THREE.HemisphereLight(0xffffff, 0x182a2e, 2.3);
  const keyLight = new THREE.DirectionalLight(0xffe7a5, 3.5);
  keyLight.position.set(-200, -300, 500);
  scene.add(ambientLight, keyLight);

  let vehicleTemplate;
  const vehicles = new Map();
  let stopped = false;
  let resizeObserver;
  let renderVehicles = () => {};

  const resize = () => {
    const width = canvas.clientWidth;
    const height = canvas.clientHeight;
    renderer.setSize(width, height, false);
    camera.right = width;
    camera.top = height;
    camera.bottom = 0;
    camera.updateProjectionMatrix();
    renderVehicles();
  };
  resize();
  resizeObserver = new ResizeObserver(resize);
  resizeObserver.observe(canvas);

  const setVehiclePosition = (root, point, nextPoint) => {
    const screenPoint = getMapPixel(map, TMap, point);
    const screenNextPoint = getMapPixel(map, TMap, nextPoint);
    if (!screenPoint || !screenNextPoint) return;
    root.position.set(screenPoint[0], canvas.clientHeight - screenPoint[1], 0);
    const angle = Math.atan2(screenPoint[1] - screenNextPoint[1], screenNextPoint[0] - screenPoint[0]);
    root.rotation.z = angle + VEHICLE_CONFIG.forwardOffset;
  };

  const cleanup = () => {
    if (stopped) return;
    stopped = true;
    resizeObserver?.disconnect();
    vehicles.forEach(({ root }) => {
      scene.remove(root);
      root.clear();
    });
    vehicles.clear();
    if (vehicleTemplate) disposeObject(vehicleTemplate);
    renderer.dispose();
  };

  const ready = new Promise((resolve, reject) => {
    const loader = new GLTFLoader();
    loader.setMeshoptDecoder(MeshoptDecoder);
    loader.load(VEHICLE_CONFIG.modelUrl, (gltf) => {
      if (stopped) {
        disposeObject(gltf.scene);
        resolve(false);
        return;
      }
      vehicleTemplate = gltf.scene;
      vehicleTemplate.rotation.set(Math.PI / 2, 0, 0);
      vehicleTemplate.traverse((node) => {
        if (!node.isMesh) return;
        node.castShadow = false;
        node.receiveShadow = false;
      });
      renderVehicles = () => {
        if (stopped || !vehicleTemplate) return;
        const positions = positionProvider();
        const visibleIds = new Set();
        positions.forEach(({ id, coordinate, nextCoordinate }) => {
          if (!coordinate) return;
          const key = String(id);
          visibleIds.add(key);
          let instance = vehicles.get(key);
          if (!instance) {
            const root = new THREE.Group();
            const model = vehicleTemplate.clone(true);
            model.scale.setScalar(VEHICLE_CONFIG.scale);
            model.rotation.set(Math.PI / 2, 0, 0);
            root.rotation.x = THREE.MathUtils.degToRad(-VEHICLE_CONFIG.pitch);
            root.add(model);
            scene.add(root);
            instance = { root };
            vehicles.set(key, instance);
          }
          setVehiclePosition(instance.root, coordinate, nextCoordinate);
        });
        vehicles.forEach(({ root }, id) => {
          if (visibleIds.has(id)) return;
          scene.remove(root);
          root.clear();
          vehicles.delete(id);
        });
        renderer.render(scene, camera);
      };
      renderVehicles();
      resolve(true);
    }, undefined, reject);
  });

  return { cleanup, ready, render: () => renderVehicles() };
}
