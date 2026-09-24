const AMAP_SCRIPT_ID = 'amap-js-api';
const AMAP_SCRIPT_TIMEOUT = 15000;
let amapPromise;

export function loadAmap() {
  if (window.AMap) return Promise.resolve(window.AMap);
  if (amapPromise) return amapPromise;

  const key = import.meta.env.VITE_AMAP_KEY;
  const securityJsCode = import.meta.env.VITE_AMAP_SECURITY_CODE;
  if (!key || !securityJsCode) {
    return Promise.reject(new Error('Missing VITE_AMAP_KEY or VITE_AMAP_SECURITY_CODE'));
  }

  window._AMapSecurityConfig = { securityJsCode };
  amapPromise = new Promise((resolve, reject) => {
    const existingScript = document.getElementById(AMAP_SCRIPT_ID);
    const script = existingScript || document.createElement('script');
    const timeout = window.setTimeout(() => reject(new Error('AMap JS API load timed out')), AMAP_SCRIPT_TIMEOUT);
    const finish = () => {
      window.clearTimeout(timeout);
      if (window.AMap) resolve(window.AMap);
      else reject(new Error('AMap loaded without global API'));
    };
    script.addEventListener('load', finish, { once: true });
    script.addEventListener('error', () => {
      window.clearTimeout(timeout);
      reject(new Error('Failed to load AMap JS API'));
    }, { once: true });
    if (!existingScript) {
      script.id = AMAP_SCRIPT_ID;
      script.src = `https://webapi.amap.com/maps?v=2.0&key=${encodeURIComponent(key)}`;
      script.async = true;
      document.head.appendChild(script);
    }
  }).catch((error) => {
    amapPromise = undefined;
    throw error;
  });
  return amapPromise;
}
