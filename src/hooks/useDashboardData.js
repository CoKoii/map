import { useEffect, useState } from 'react';
import { fetchDashboardOrders, fetchDashboardOverview } from '../services/dashboardApi';

const REFRESH_INTERVAL = 15_000;

function applyResult(result, setData, setError) {
  if (result.status === 'fulfilled') {
    setData(result.value);
    setError(false);
  } else if (result.reason?.name !== 'AbortError') {
    setError(true);
  }
}

export function useDashboardData() {
  const [overview, setOverview] = useState(null);
  const [orders, setOrders] = useState(null);
  const [overviewError, setOverviewError] = useState(false);
  const [ordersError, setOrdersError] = useState(false);

  useEffect(() => {
    let active = true;
    let requestId = 0;
    let controller;

    const refresh = async () => {
      controller?.abort();
      controller = new AbortController();
      const currentRequestId = ++requestId;
      const { signal } = controller;
      const results = await Promise.allSettled([
        fetchDashboardOverview(signal),
        fetchDashboardOrders(signal)
      ]);

      if (!active || currentRequestId !== requestId) return;
      applyResult(results[0], setOverview, setOverviewError);
      applyResult(results[1], (data) => setOrders(Array.isArray(data.orderList) ? data.orderList : []), setOrdersError);
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

  return { overview, orders, overviewError, ordersError };
}
