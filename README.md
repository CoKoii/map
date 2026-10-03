# 昆山收运运行总览

这是一个全屏地图大屏，地图使用腾讯地图 JavaScript API GL 作为渲染层，默认中心为昆山。昆山行政边界和处置设施信息保存在本地；车辆位置、采样轨迹、运营指标、区域收运和实时订单从大屏查询服务读取。

## 运行

```bash
npm install
npm run dev -- --port 4173
```

然后打开 `http://127.0.0.1:4173/`。

生成最终交付文件：

```bash
npm run build:single
```

输出目录 `dist-single/` 只包含 `index.html` 和 `car.glb`。HTML 内已内嵌 CSS、JavaScript 和横幅图片，部署时只需保留这两个文件；地图底图仍需要网络和有效的腾讯地图 Key。

页面直接请求 `http://139.196.108.216:9212/api/large/dashboard`，因此可以用浏览器双击 HTML 后请求实时数据。接口服务器必须允许文件来源的跨域请求（通常允许 `Origin: null`，或按接口安全策略允许 `*`）；否则浏览器会因 CORS 拦截响应，前端无法绕过这个限制。构建时可用 `VITE_DASHBOARD_API_BASE_URL` 覆盖该地址：

```bash
VITE_DASHBOARD_API_BASE_URL=https://your-api.example.com/api/large/dashboard npm run build:single
```

## 验证

```bash
npm test
npm run build
```

## 已接入

- 腾讯地图 JavaScript API GL：真实底图、原生建筑数据、暗色主题和 3D 视角
- 大屏查询服务：`GET /api/large/dashboard/overview` 与 `GET /api/large/dashboard/orders`，每 30 秒刷新
- 订单实时地图：按车辆最新定位显示车牌、状态和 3D 车辆模型，并在页面运行期间累计 GPS 采样轨迹
- 腾讯地图底图文字保持全图显示；业务点位使用自定义标签，行政边界单独高亮
- 本地 GeoJSON：昆山行政边界及 GCJ-02 转换数据
- `npm run data:kunshan`：重新下载昆山行政边界数据
- `npm run data:gcj02`：从 `public/data` 生成腾讯地图使用的 GCJ-02 边界数据
- `npm run data:amap`：旧命令兼容别名

## 工程结构

- `src/config/map.js`：地图视角、建筑规格、颜色主题和车辆参数
- `src/data/dashboardFixtures.js`：仪表盘演示指标、流程和服务内容
- `src/services/tencentMap.js`：腾讯地图 GL 渲染层的单例加载
- `src/services/dashboardApi.js`：大屏查询接口和统一响应校验
- `src/services/mapOverlays.js`：边界、建筑、点位和路线覆盖物
- `src/services/orderMapTracking.js`：订单实时定位、采样路线和车辆标记
- `src/services/vehicleAnimation.js`：Three.js 车辆模型与地图坐标同步
- `src/components/Dashboard.jsx`：仪表盘页眉、统计面板、分布图与流程条
- `src/components/MapView.jsx`：地图生命周期与服务编排

地图、车辆模型和业务接口按约定的真实数据链路加载，接口错误会直接显示在页面状态层。

腾讯地图 Key 设置在 `src/services/tencentMap.js` 的 `TENCENT_KEY` 中；请在腾讯位置服务控制台配置 Web 服务 Key 的域名白名单。

接口地址默认是 `http://139.196.108.216:9212/api/large/dashboard`，可通过 `VITE_DASHBOARD_API_BASE_URL` 指定完整接口基础路径。
