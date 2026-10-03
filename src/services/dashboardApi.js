const API_BASE_URL = (import.meta.env.VITE_DASHBOARD_API_BASE_URL
  || 'http://139.196.108.216:9212/api/large/dashboard').replace(/\/$/, '');

async function getDashboardData(path, signal) {
  const response = await fetch(`${API_BASE_URL}/${path}`, {
    headers: { Accept: 'application/json' },
    signal
  });

  if (!response.ok) {
    throw new Error(`Dashboard API returned HTTP ${response.status}`);
  }

  const result = await response.json();
  if (result.code !== '0') {
    throw new Error(result.msg);
  }

  return result;
}

export function fetchDashboardOverview(signal) {
  return getDashboardData('overview', signal);
}

export function fetchDashboardOrders(signal) {
  return getDashboardData('orders', signal);
}
