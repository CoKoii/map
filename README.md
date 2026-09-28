# 昆山收运运行总览

这是一个全屏地图大屏，地图使用腾讯地图 JavaScript API GL 作为渲染层，默认中心为昆山。昆山行政边界保存在本地，业务点位、坐标和路线都来自本地 mock 数据，后续可由后端接口替换。

## 运行

```bash
npm install
npm run dev -- --port 4173
```

然后打开 `http://127.0.0.1:4173/`。

生成可直接双击打开的单文件 HTML：

```bash
npm run build:single
```

生成文件为 `dist-single/kunshan-transport-dashboard.html`。文件已内嵌业务数据、边界、样式、脚本和车辆模型；地图底图仍需要网络和有效的腾讯地图 Key。

## 验证

```bash
npm test
npm run build
```

## 已接入

- 腾讯地图 JavaScript API GL：真实底图、原生建筑数据、暗色主题和 3D 视角
- 本地 mock 地图数据：三个业务点位的真实坐标快照和三组路线快照
- 腾讯地图底图文字保持全图显示；业务点位使用自定义标签，行政边界单独高亮
- 本地 GeoJSON：昆山行政边界及 GCJ-02 转换数据
- `npm run data:kunshan`：重新下载昆山行政边界数据
- `npm run data:gcj02`：从 `public/data` 生成腾讯地图使用的 GCJ-02 边界数据
- `npm run data:amap`：旧命令兼容别名

## 工程结构

- `src/config/map.js`：地图视角、建筑规格、颜色主题和车辆参数
- `src/data/dashboardFixtures.js`：仪表盘演示指标、流程和服务内容
- `src/data/mapFixtures.js`：地图点位和路线演示数据
- `src/services/tencentMap.js`：腾讯地图 GL 渲染层的单例加载、超时和失败重试
- `src/services/mapData.js`：边界和地图数据适配器；当前返回 mock 数据
- `src/services/mapOverlays.js`：边界、建筑、点位和路线覆盖物
- `src/services/vehicleAnimation.js`：Three.js 车辆模型与地图坐标同步
- `src/services/transactionSimulation.js`：随机订单状态机与建筑/路线/车辆生命周期
- `src/components/Dashboard.jsx`：仪表盘页眉、统计面板、分布图与流程条
- `src/components/MapView.jsx`：地图生命周期与服务编排

地图加载失败时页面会提供重新加载入口；车辆模型资源和 mock 路线不会阻塞整个仪表盘。

腾讯地图 Key 设置在 `src/services/tencentMap.js` 的 `TENCENT_KEY` 中；请在腾讯位置服务控制台配置 Web 服务 Key 的域名白名单。
