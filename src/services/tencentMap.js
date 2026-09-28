const TENCENT_SCRIPT_ID = 'tencent-map-gl-api';
const TENCENT_SCRIPT_TIMEOUT = 15000;
const TENCENT_KEY = '3F7BZ-NNFWH-GWMDY-WSNZ4-7WRHE-SQFZZ';

let tencentMapPromise;

export function loadTencentMap() {
  if (window.TMap?.Map) return Promise.resolve(window.TMap);
  if (tencentMapPromise) return tencentMapPromise;

  tencentMapPromise = new Promise((resolve, reject) => {
    const existingScript = document.getElementById(TENCENT_SCRIPT_ID);
    const script = existingScript || document.createElement('script');
    const clearListeners = () => {
      script.removeEventListener('load', finish);
      script.removeEventListener('error', fail);
    };
    const timeout = window.setTimeout(() => {
      clearListeners();
      script.remove();
      const error = new Error('Tencent Map GL API load timed out');
      error.code = 'MAP_LOAD_TIMEOUT';
      reject(error);
    }, TENCENT_SCRIPT_TIMEOUT);
    const finish = () => {
      window.clearTimeout(timeout);
      clearListeners();
      if (window.TMap?.Map) {
        resolve(window.TMap);
        return;
      }
      script.remove();
      reject(new Error('Tencent Map loaded without global API'));
    };
    const fail = () => {
      window.clearTimeout(timeout);
      clearListeners();
      script.remove();
      reject(new Error('Failed to load Tencent Map GL API'));
    };
    script.addEventListener('load', finish, { once: true });
    script.addEventListener('error', fail, { once: true });
    if (!existingScript) {
      script.id = TENCENT_SCRIPT_ID;
      script.src = `https://map.qq.com/api/gljs?v=1.exp&key=${encodeURIComponent(TENCENT_KEY)}`;
      script.async = true;
      document.head.appendChild(script);
    }
  }).catch((error) => {
    tencentMapPromise = undefined;
    throw error;
  });
  return tencentMapPromise;
}
