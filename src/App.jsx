import React, { useState } from 'react';
import MapView from './components/MapView';
import DashboardOverlay, { DashboardHeader } from './components/Dashboard';
import { useDashboardData } from './hooks/useDashboardData';

export default function App() {
  const data = useDashboardData();
  const [activeOrder, setActiveOrder] = useState(null);
  const apiState = data.loading ? 'loading' : data.error ? 'error' : 'connected';

  return (
    <main className="map-app">
      <MapView orders={data.orders} onActiveOrderChange={setActiveOrder} />
      <div className="map-global-mask" aria-hidden="true" />
      <DashboardHeader apiState={apiState} />
      <DashboardOverlay overview={data.overview} activeOrder={activeOrder} loading={data.loading} error={data.error} />
    </main>
  );
}
