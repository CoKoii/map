import React, { useEffect, useRef, useState } from 'react';
import { Truck } from 'lucide-react';
import { loadAmap } from '../services/amap';
import { MAP_CONFIG } from '../config/map';
import { fetchBoundary, fetchMapData } from '../services/mapData';
import { addBoundaryLayers } from '../services/mapOverlays';
import { createTransactionSimulation } from '../services/transactionSimulation';

function createMap(AMap, element) {
  return new AMap.Map(element, {
    viewMode: '3D',
    center: MAP_CONFIG.center,
    zoom: MAP_CONFIG.zoom,
    pitch: MAP_CONFIG.pitch,
    rotation: MAP_CONFIG.rotation,
    zooms: MAP_CONFIG.zooms,
    dragEnable: false,
    zoomEnable: false,
    doubleClickZoom: false,
    scrollWheel: false,
    touchZoom: false,
    keyboardEnable: false,
    rotateEnable: false,
    pitchEnable: false,
    features: ['bg', 'road', 'building', 'point'],
    showBuildingBlock: true,
    mapStyle: MAP_CONFIG.style
  });
}

function loadScene({ AMap, map, boundary, mapData, canvas, overlays, vehicleIcon }) {
  overlays.push(...addBoundaryLayers(map, AMap, boundary));
  return {
    transactionSimulation: createTransactionSimulation({
      AMap,
      map,
      places: mapData.places,
      routes: mapData.routes,
      canvas,
      vehicleIcon
    })
  };
}

function getMapErrorMessage(error) {
  if (error.message?.includes('Missing')) return '请配置地图渲染服务 Key 和安全密钥';
  if (error.message?.includes('timed out')) return '地图渲染服务响应超时';
  return '地图数据加载失败';
}

export default function MapView() {
  const mapElement = useRef(null);
  const vehicleCanvas = useRef(null);
  const vehicleIcon = useRef(null);
  const [status, setStatus] = useState('地图数据加载中');
  const [ready, setReady] = useState(false);
  const [hasError, setHasError] = useState(false);
  const [retryToken, setRetryToken] = useState(0);

  useEffect(() => {
    let cancelled = false;
    let map;
    let overlays = [];
    let transactionSimulation = { cleanup: () => {} };

    const initialize = async () => {
      setReady(false);
      setHasError(false);
      setStatus('地图数据加载中');
      try {
        const [AMap, boundary, mapData] = await Promise.all([loadAmap(), fetchBoundary(), fetchMapData()]);
        if (cancelled) return;
        map = createMap(AMap, mapElement.current);
        map.on('complete', () => {
          if (cancelled) return;
          try {
            const scene = loadScene({ AMap, map, boundary, mapData, canvas: vehicleCanvas.current, overlays, vehicleIcon: vehicleIcon.current });
            if (cancelled) return;
            transactionSimulation = scene.transactionSimulation;
            transactionSimulation.start();
            setReady(true);
            setStatus('地图已连接 · mock 路线模拟中');
          } catch (error) {
            console.info('AMap map data initialization failed', error);
            if (!cancelled) {
              setHasError(true);
              setStatus(getMapErrorMessage(error));
            }
          }
        });
      } catch (error) {
        console.info('AMap initialization failed', error);
        if (!cancelled) {
          setHasError(true);
          setStatus(getMapErrorMessage(error));
        }
      }
    };

    initialize();
    return () => {
      cancelled = true;
      transactionSimulation.cleanup();
      overlays.flat().filter(Boolean).forEach((overlay) => {
        overlay.setMap?.(null);
      });
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
          <strong>{status}</strong>
          {!hasError && <small>正在准备地图与 3D 车辆</small>}
          {hasError && <button className="map-retry" type="button" onClick={() => setRetryToken((value) => value + 1)}>重新加载</button>}
        </div>
      </div>}
    </section>
  );
}
