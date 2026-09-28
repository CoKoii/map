import React from 'react';
import MapView from './components/MapView';
import DashboardOverlay, { DashboardHeader } from './components/Dashboard';

export default function App() {
  return (
    <main className="map-app">
      <MapView />
      <DashboardHeader />
      <DashboardOverlay />
    </main>
  );
}
