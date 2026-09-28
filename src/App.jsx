import React from 'react';
import MapView from './components/MapView';
import DashboardOverlay, { DashboardHeader, useDashboardData } from './components/Dashboard';

export default function App() {
  const data = useDashboardData();
  const apiState = !data.overview && !data.orders ? (data.overviewError || data.ordersError ? 'error' : 'loading')
    : data.overviewError || data.ordersError ? 'error' : 'connected';

  return (
    <main className="map-app">
      <MapView orders={data.orders} />
      <div className="map-global-mask" aria-hidden="true" />
      <DashboardHeader apiState={apiState} />
      <DashboardOverlay {...data} />
    </main>
  );
}
