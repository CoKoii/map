// A file opened with double-click has no site origin and cannot use the Vite
// proxy. The single-file build therefore points at the API server directly;
// regular builds keep the same-origin path so they can use a reverse proxy.
const configuredBaseUrl = import.meta.env.VITE_DASHBOARD_API_BASE_URL
  || (import.meta.env.MODE === 'single' ? 'http://139.196.108.216:9212/api/large/dashboard' : '/api/large/dashboard');
const API_BASE_URL = configuredBaseUrl.replace(/\/$/, '');

async function getDashboardData(path, signal) {
  const response = await fetch(`${API_BASE_URL}/${path}`, {
    headers: { Accept: 'application/json' },
    signal
  });

  if (!response.ok) {
    throw new Error(`Dashboard API returned HTTP ${response.status}`);
  }

  const result = await response.json();
  if (!result || String(result.code) !== '0') {
    throw new Error(result?.msg || 'Dashboard API returned an invalid response');
  }

  return result.data ?? result;
}

export function fetchDashboardOverview(signal) {
  return getDashboardData('overview', signal);
}

export function fetchDashboardOrders(signal) {
  return getDashboardData('orders', signal);
}
