import {
  faBuilding,
  faCircleCheck,
  faClipboardList,
  faFileLines,
  faLandmark,
  faLocationDot,
  faRecycle,
  faTruck,
  faUser
} from '@fortawesome/free-solid-svg-icons';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import React, { useEffect, useState } from 'react';
import constructionWasteBanner from '../assets/construction-waste-banner.webp';
import { ROTATION_INTERVAL } from '../config/map';
import {
  EXECUTION_METRICS,
  PROCESS_STEPS,
  SERVICE_ITEMS,
  STAT_ITEMS,
} from '../data/dashboardFixtures';

const numberFormatters = {
  0: new Intl.NumberFormat('zh-CN', { maximumFractionDigits: 0 }),
  1: new Intl.NumberFormat('zh-CN', { maximumFractionDigits: 1 }),
  2: new Intl.NumberFormat('zh-CN', { maximumFractionDigits: 2 })
};

function useDataCarousel(itemCount, visibleCount) {
  const [startIndex, setStartIndex] = useState(0);

  useEffect(() => {
    setStartIndex((current) => itemCount ? current % itemCount : 0);
  }, [itemCount]);

  useEffect(() => {
    if (itemCount <= visibleCount) return undefined;
    const timer = window.setInterval(() => setStartIndex((current) => (current + 1) % itemCount), ROTATION_INTERVAL);
    return () => window.clearInterval(timer);
  }, [itemCount, visibleCount]);

  return {
    visibleItems: (items) => Array.from(
      { length: Math.min(items.length, visibleCount) },
      (_, offset) => items[(startIndex + offset) % items.length]
    )
  };
}

function displayNumber(value, fractionDigits = 0) {
  return numberFormatters[fractionDigits].format(value);
}

const TRACKING_STEPS = ['预约提交', '车辆到场', '交付确认', '运输中', '到场回执'];

function getTrackingStage(order) {
  if (!order) return -1;
  const status = order.status;
  if (/回执|完成|联单确认/.test(status)) return 4;
  if (/运输/.test(status)) return 3;
  if (/交付/.test(status)) return 2;
  if (/装载|到场/.test(status)) return 1;
  return 0;
}

const ICONS = {
  building: faBuilding,
  check: faCircleCheck,
  clipboard: faClipboardList,
  file: faFileLines,
  landmark: faLandmark,
  pin: faLocationDot,
  recycle: faRecycle,
  truck: faTruck,
  user: faUser
};

function PageIcon({ name, size, ...props }) {
  return <FontAwesomeIcon icon={ICONS[name]} width={size} height={size} {...props} />;
}

export function DashboardHeader({ apiState }) {
  return (
    <header className="map-title">
      <div className="brand-lockup">
        <a className="brand-mark" href="index.html#/view/9b6e20d5577083d771e8f13bdf0c3b33">城建<span>绿和</span></a>
        <div className="brand-sub">共建更美好的昆山</div>
        <div className="brand-hero">
          <div className="brand-hero-title"><span>收</span><span>运</span></div>
          <div className="brand-hero-sub">昆山 · 城市服务</div>
          <div className="brand-hero-rule" />
          <div className="brand-hero-copy">让城市更整洁，让生活更美好</div>
        </div>
      </div>
      <div className="title-lockup">
        <h1>昆山市装修垃圾收运<em>运行总览</em></h1>
        <div className="title-rule">
          <svg className="header-ornament" viewBox="-32 0 1424 32" preserveAspectRatio="none" aria-hidden="true">
            <defs>
              <linearGradient id="header-ornament-gold" x1="0" x2="1">
                <stop offset="0" stopColor="#9b8050" stopOpacity="0.55" />
                <stop offset="0.5" stopColor="#f0d28d" />
                <stop offset="1" stopColor="#9b8050" stopOpacity="0.55" />
              </linearGradient>
            </defs>
            <path d="M-32 12H353L365 22H388L399 28H508 M852 28H961L972 22H995L1007 12H1392" />
            <path className="header-ornament-detail" d="M-32 15H351L362 24H388 M972 24H998L1009 15H1392" />
          </svg>
          <b>小程序预约　·　装修清运　·　全程可查</b>
        </div>
      </div>
      <div className="top-meta">
        <strong className={`api-state ${apiState}`}>{apiState === 'loading' ? '数据加载中' : apiState === 'error' ? '数据接口异常' : '实时业务数据'}</strong>
        <div>精细管理　 高效收运　 洁净昆山</div>
      </div>
    </header>
  );
}

function StatStrip({ overview }) {
  return (
    <section className="stat-strip" aria-label="运营指标">
      {STAT_ITEMS.map(({ label, unit, icon, field, fractionDigits = 0 }) => {
        const value = overview ? displayNumber(overview[field], fractionDigits) : '—';
        return (
          <div className="stat-item" key={field}>
            <PageIcon name={icon} size={30} aria-hidden="true" />
            <div className="stat-copy"><span>{label}</span><strong>{value}<small>{unit}</small></strong></div>
          </div>
        );
      })}
    </section>
  );
}

function Panel({ title, meta, children, className = '' }) {
  return (
    <section className={['dashboard-panel', className].filter(Boolean).join(' ')}>
      <div className="panel-heading">
        <div className="panel-title">
          <h2>{title}</h2>
        </div>
        {meta && <span>{meta}</span>}
      </div>
      {children}
    </section>
  );
}

function ServicePanel() {
  return (
    <Panel title="预约服务" meta="多方参与 · 便捷预约">
      <div className="service-list">
        {SERVICE_ITEMS.map(({ icon, title, detail }) => {
          return (
            <div className="service-row" key={title}>
              <PageIcon name={icon} size={32} aria-hidden="true" />
              <div><strong>{title}</strong><span>{detail}</span></div>
            </div>
          );
        })}
      </div>
    </Panel>
  );
}

function DistributionPanel({ regions, loading, error }) {
  const carousel = useDataCarousel(regions.length, 4);
  const visibleRegions = carousel.visibleItems(regions);
  const maxValue = Math.max(1, ...regions.map((item) => Number(item.collectionCount)));
  return (
    <Panel title="区域收运分布" meta="完成车次 · 吨" className="carousel-panel">
      <div className="bar-list">
        {regions.length ? visibleRegions.map((item) => {
          const count = Number(item.collectionCount);
          return <div className="bar-row data-carousel-row" key={item.regionId}>
            <span title={item.regionName}>{item.regionName}</span>
            <div className="bar-track"><i style={{ width: `${(count / maxValue) * 100}%` }} /></div>
            <b title={`${displayNumber(item.collectionWeight, 2)} 吨`}>{displayNumber(count)}<small>{displayNumber(item.collectionWeight, 1)} 吨</small></b>
          </div>;
        }) : <div className="data-empty">{loading ? '区域数据加载中' : error ? '区域数据暂不可用' : '暂无区域收运数据'}</div>}
      </div>
    </Panel>
  );
}

function ExecutionPanel({ execution }) {
  return (
    <Panel title="收运执行" meta="今日任务 · 单">
      <div className="execution-grid">
        {EXECUTION_METRICS.map(({ icon, label, field }) => {
          const value = execution ? displayNumber(execution[field]) : '—';
          return <div key={label}><PageIcon name={icon} size={28} aria-hidden="true" /><strong>{value}</strong><span>{label}</span></div>;
        })}
      </div>
    </Panel>
  );
}

function CitySlogan() {
  return (
    <div className="city-slogan" aria-label="昆山 人文江南 宜居之城 KUNSHAN">
      <strong>昆山</strong>
      <span>人文江南 · 宜居之城</span>
      <b>KUNSHAN</b>
    </div>
  );
}

function TrackingPanel({ order, loading, error }) {
  const currentStep = getTrackingStage(order);
  const locationText = order
    ? `${order.communityProject} → ${order.realtimeTrack.endPoint.name}`
    : loading ? '订单数据加载中' : error ? '订单数据暂不可用' : '暂无当前任务';
  return (
    <Panel title="清运任务追踪" meta="全流程可查 · 实时记录" className="tracking-panel">
      <div className="tracking-meta">
        <div className="tracking-order">
          <span>{order?.orderNo || (loading ? '订单数据加载中' : error ? '订单数据暂不可用' : '暂无当前任务')}</span>
          {order && <b>{order.vehiclePlate}</b>}
        </div>
        <div className="tracking-location">
          <span title={locationText}>{locationText}</span>
        </div>
      </div>
      <div className="tracking-steps">
        {TRACKING_STEPS.map((step, index) => (
          <div className={`tracking-step ${index < currentStep ? 'is-done' : ''} ${index === currentStep ? 'is-current' : ''}`} key={step}>
            <span>{currentStep >= 0 && index < currentStep ? <PageIcon name="check" size={21} /> : currentStep >= 0 && index === currentStep ? <PageIcon name="truck" size={19} /> : <i />}</span>
            <b>{step}</b>
          </div>
        ))}
      </div>
      <div className="tracking-media">
        <img src={constructionWasteBanner} alt="袋装装修垃圾规范清运" />
      </div>
    </Panel>
  );
}

function ProcessBar() {
  return (
    <nav className="process-bar" aria-label="清运流程">
      {PROCESS_STEPS.map(([label, icon], index) => {
        return (
          <React.Fragment key={label}>
            <div className="process-step"><span><PageIcon name={icon} size={21} /></span><b>{label}</b></div>
            {index < PROCESS_STEPS.length - 1 && <i aria-hidden="true">›</i>}
          </React.Fragment>
        );
      })}
    </nav>
  );
}

export default function DashboardOverlay({ overview, activeOrder, loading, error }) {
  const regions = overview ? overview.regionCollection : [];
  return (
    <div className="dashboard-overlay">
      <StatStrip overview={overview?.overview} />
      <aside className="dashboard-rail dashboard-rail-left"><ServicePanel /><DistributionPanel regions={regions} loading={loading} error={error} /></aside>
      <aside className="dashboard-rail dashboard-rail-right"><CitySlogan /><ExecutionPanel execution={overview?.execution} /><TrackingPanel order={activeOrder} loading={loading} error={error} /></aside>
      <ProcessBar />
    </div>
  );
}
