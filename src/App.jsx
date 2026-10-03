import React from 'react';
import MapView from './components/MapView';
import DashboardOverlay, { DashboardHeader } from './components/Dashboard';
import { useDashboardData } from './hooks/useDashboardData';

export default function App() {
  const data = useDashboardData();
  const apiState = data.loading ? 'loading' : data.error ? 'error' : 'connected';

  return (
    <main className="map-app">
      <MapView orders={data.orders} />
      <div className="map-global-mask" aria-hidden="true" />
      <DashboardHeader apiState={apiState} />
      <DashboardOverlay overview={data.overview} orders={data.orders} loading={data.loading} error={data.error} />
    </main>
  );
}
