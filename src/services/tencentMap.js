const TENCENT_KEY = '3F7BZ-NNFWH-GWMDY-WSNZ4-7WRHE-SQFZZ';
const TENCENT_SCRIPT_URL = `https://map.qq.com/api/gljs?v=1.exp&key=${encodeURIComponent(TENCENT_KEY)}`;

let mapPromise;

export function loadTencentMap() {
  if (mapPromise) return mapPromise;

  mapPromise = new Promise((resolve, reject) => {
    const script = document.createElement('script');
    script.src = TENCENT_SCRIPT_URL;
    script.async = true;
    script.onload = () => resolve(window.TMap);
    script.onerror = () => reject(new Error('Tencent Map GL API load failed'));
    document.head.append(script);
  });

  return mapPromise;
}
