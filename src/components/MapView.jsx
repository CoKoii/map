import React, { useEffect, useRef, useState } from 'react';
import { Truck } from 'lucide-react';
import { loadTencentMap } from '../services/tencentMap';
import { MAP_CONFIG } from '../config/map';
import { getMapData } from '../services/mapData';
import { addBoundaryLayers } from '../services/mapOverlays';
import { createTransactionSimulation } from '../services/transactionSimulation';

function createMap(TMap, element) {
  return new TMap.Map(element, {
    viewMode: '3D',
    center: new TMap.LatLng(MAP_CONFIG.center[1], MAP_CONFIG.center[0]),
    zoom: MAP_CONFIG.zoom,
    pitch: MAP_CONFIG.pitch,
    rotation: MAP_CONFIG.rotation,
    minZoom: MAP_CONFIG.zooms[0],
    maxZoom: MAP_CONFIG.zooms[1],
    mapStyleId: MAP_CONFIG.style,
    showBuilding: true,
    showControl: false,
    draggable: false,
    scrollable: false,
    touchZoomable: false,
    pitchable: false,
    rotatable: false,
    doubleClickZoom: false
  });
}

function loadScene({ TMap, map, mapData, canvas, overlays, vehicleIcon }) {
  overlays.push(...addBoundaryLayers(map, TMap, mapData.boundary));
  return createTransactionSimulation({
    TMap,
    map,
    places: mapData.places,
    routes: mapData.routes,
    canvas,
    vehicleIcon
  });
}

function getMapErrorMessage(error) {
  if (error?.code === 'MAP_LOAD_TIMEOUT') return '地图渲染服务响应超时';
  return '地图数据加载失败';
}

export default function MapView() {
  const mapElement = useRef(null);
  const vehicleCanvas = useRef(null);
  const vehicleIcon = useRef(null);
  const [mapState, setMapState] = useState({ phase: 'loading', message: '地图数据加载中' });
  const [retryToken, setRetryToken] = useState(0);
  const ready = mapState.phase === 'ready';
  const hasError = mapState.phase === 'error';

  useEffect(() => {
    let cancelled = false;
    let map;
    let overlays = [];
    let transactionSimulation = { cleanup: () => {} };

    const initialize = async () => {
      setMapState({ phase: 'loading', message: '地图数据加载中' });
      try {
        const TMap = await loadTencentMap();
        if (cancelled) return;
        const mapData = getMapData();
        map = createMap(TMap, mapElement.current);
        let sceneLoaded = false;
        map.on('idle', () => {
          if (sceneLoaded) return;
          sceneLoaded = true;
          if (cancelled) return;
          try {
            transactionSimulation = loadScene({ TMap, map, mapData, canvas: vehicleCanvas.current, overlays, vehicleIcon: vehicleIcon.current });
            if (cancelled) return;
            transactionSimulation.start();
            setMapState({ phase: 'ready', message: '地图已连接 · mock 路线模拟中' });
          } catch (error) {
            console.info('Tencent Map data initialization failed', error);
            if (!cancelled) setMapState({ phase: 'error', message: getMapErrorMessage(error) });
          }
        });
      } catch (error) {
        console.info('Tencent Map initialization failed', error);
        if (!cancelled) setMapState({ phase: 'error', message: getMapErrorMessage(error) });
      }
    };

    initialize();
    return () => {
      cancelled = true;
      transactionSimulation.cleanup();
      overlays.forEach((overlay) => overlay.setMap?.(null));
      map?.destroy();
    };
  }, [retryToken]);

  return (
    <section className="map-wrap" aria-label="建筑垃圾处置中心与花桥镇 mock 路线地图">
      <div id="map" ref={mapElement} />
      <canvas className="vehicle-layer" ref={vehicleCanvas} aria-hidden="true" />
      <div className="vehicle-icon" ref={vehicleIcon} aria-hidden="true"><Truck size={20} strokeWidth={2.2} /></div>
      <div className="map-wash" />
      {!ready && <div className={`map-fallback ${hasError ? 'is-error' : ''}`}>
        <div className="loading-card">
          {!hasError && <span className="loading-spinner" aria-hidden="true" />}
          <strong>{mapState.message}</strong>
          {!hasError && <small>正在准备地图与 3D 车辆</small>}
          {hasError && <button className="map-retry" type="button" onClick={() => setRetryToken((value) => value + 1)}>重新加载</button>}
        </div>
      </div>}
    </section>
  );
}
