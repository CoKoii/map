import { useEffect, useState } from 'react';
import { fetchDashboardOrders, fetchDashboardOverview } from '../services/dashboardApi';

const REFRESH_INTERVAL = 15_000;

export function useDashboardData() {
  const [data, setData] = useState({ overview: null, orders: [], loading: true, error: null });

  useEffect(() => {
    let active = true;
    let requestId = 0;
    let controller;

    const refresh = async () => {
      controller?.abort();
      controller = new AbortController();
      const currentRequestId = ++requestId;
      const { signal } = controller;
      try {
        const [overview, orders] = await Promise.all([
          fetchDashboardOverview(signal),
          fetchDashboardOrders(signal)
        ]);
        if (!active || currentRequestId !== requestId) return;
        setData({ overview, orders: orders.orderList, loading: false, error: null });
      } catch (error) {
        if (!active || currentRequestId !== requestId || error.name === 'AbortError') return;
        setData((current) => ({ ...current, loading: false, error }));
      }
    };

    refresh();
    const timer = window.setInterval(refresh, REFRESH_INTERVAL);
    return () => {
      active = false;
      requestId += 1;
      window.clearInterval(timer);
      controller?.abort();
    };
  }, []);

  return data;
}
