import React, { useEffect, useRef, useState } from 'react';
import boundaryData from '../data/kunshan-boundary-gcj02.json';
import { loadTencentMap } from '../services/tencentMap';
import { MAP_CONFIG } from '../config/map';
import { addBoundaryLayers } from '../services/mapOverlays';
import { createOrderMapTracking } from '../services/orderMapTracking';
import { loadVehicleAnimation } from '../services/vehicleAnimation';

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

function loadScene({ TMap, map, boundary, canvas, overlays, onVehicleError }) {
  overlays.push(...addBoundaryLayers(map, TMap, boundary));
  const orderTracking = createOrderMapTracking({ TMap, map });
  const vehicleAnimation = loadVehicleAnimation(TMap, map, canvas, orderTracking.getVehiclePositions);
  vehicleAnimation.ready.catch(onVehicleError);

  return {
    updateOrders(orders) {
      orderTracking.update(orders);
      vehicleAnimation.render();
    },
    cleanup() {
      orderTracking.cleanup();
      vehicleAnimation.cleanup();
    }
  };
}

function getMapErrorMessage(error) {
  return error.message;
}

export default function MapView({ orders }) {
  const mapElement = useRef(null);
  const vehicleCanvas = useRef(null);
  const orderTrackingRef = useRef(null);
  const ordersRef = useRef(orders);
  ordersRef.current = orders;
  const [mapState, setMapState] = useState({ phase: 'loading', message: '地图数据加载中' });
  const ready = mapState.phase === 'ready';

  useEffect(() => {
    let cancelled = false;
    let map;
    let overlays = [];
    let orderTracking = { updateOrders: () => {}, cleanup: () => {} };

    const initialize = async () => {
      setMapState({ phase: 'loading', message: '地图数据加载中' });
      try {
        const TMap = await loadTencentMap();
        if (cancelled) return;
        map = createMap(TMap, mapElement.current);
        let sceneLoaded = false;
        map.on('idle', () => {
          if (sceneLoaded) return;
          sceneLoaded = true;
          if (cancelled) return;
          try {
            orderTracking = loadScene({
              TMap,
              map,
              boundary: boundaryData,
              canvas: vehicleCanvas.current,
              overlays,
              onVehicleError: (error) => setMapState({ phase: 'error', message: error.message })
            });
            orderTrackingRef.current = orderTracking;
            orderTracking.updateOrders(ordersRef.current);
            if (cancelled) return;
            setMapState({ phase: 'ready', message: '地图已连接 · 订单实时定位与轨迹已接入' });
          } catch (error) {
            if (!cancelled) setMapState({ phase: 'error', message: getMapErrorMessage(error) });
          }
        });
      } catch (error) {
        if (!cancelled) setMapState({ phase: 'error', message: getMapErrorMessage(error) });
      }
    };

    initialize();
    return () => {
      cancelled = true;
      orderTracking.cleanup();
      if (orderTrackingRef.current === orderTracking) orderTrackingRef.current = null;
      overlays.forEach((overlay) => overlay.setMap(null));
      map?.destroy();
    };
  }, []);

  useEffect(() => {
    orderTrackingRef.current?.updateOrders(orders);
  }, [orders]);

  return (
    <section className="map-wrap" aria-label="昆山市装修垃圾收运订单实时定位与轨迹地图">
      <div id="map" ref={mapElement} />
      <canvas className="vehicle-layer" ref={vehicleCanvas} aria-hidden="true" />
      <div className="map-wash" />
      {!ready && <div className="map-status">
        <div className="loading-card">
          {mapState.phase === 'loading' && <span className="loading-spinner" aria-hidden="true" />}
          <strong>{mapState.message}</strong>
          {mapState.phase === 'loading' && <small>正在准备地图与 3D 车辆</small>}
        </div>
      </div>}
    </section>
  );
}
