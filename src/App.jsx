import React from 'react';
import {
  Building2,
  CheckCircle2,
  ClipboardList,
  FileText,
  Landmark,
  MapPin,
  PackageCheck,
  Recycle,
  Route,
  Truck,
  UserRound
} from 'lucide-react';
import MapView from './components/MapView';
import {
  AREA_DISTRIBUTION,
  EXECUTION_METRICS,
  PROCESS_STEPS,
  SERVICE_ITEMS,
  STAT_ITEMS,
  TRACKING_STEPS
} from './data/mockDashboard';

const ICONS = {
  building: Building2,
  check: CheckCircle2,
  clipboard: ClipboardList,
  file: FileText,
  landmark: Landmark,
  pin: MapPin,
  recycle: Recycle,
  truck: Truck,
  user: UserRound
};

function Header() {
  return (
    <header className="map-title">
      <div className="brand-lockup"><div className="brand-mark">城建<span>绿和</span></div><div className="brand-sub">共建更美好的昆山</div><div className="brand-hero"><div className="brand-hero-title"><span>收</span><span>运</span></div><div className="brand-hero-sub">昆山 · 城市服务</div><div className="brand-hero-rule" /><div className="brand-hero-copy">让城市更整洁，让生活更美好</div></div></div>
      <div className="title-lockup"><h1>昆山市装修垃圾收运<em>运行总览</em></h1><div className="title-rule"><span /><b>小程序预约　·　装修清运　·　全程可查</b><span /></div></div>
      <div className="top-meta"><strong>设计方案 · 演示数据</strong><div>精细管理　 高效收运　 洁净昆山</div></div>
    </header>
  );
}

function StatStrip() {
  return <section className="stat-strip" aria-label="运营指标">
    {STAT_ITEMS.map(({ label, value, unit, icon }) => {
      const Icon = ICONS[icon];
      return <div className="stat-item" key={label}>
        <Icon size={30} strokeWidth={1.7} aria-hidden="true" />
        <div className="stat-copy"><span>{label}</span><strong>{value}<small>{unit}</small></strong></div>
      </div>;
    })}
  </section>;
}

function Panel({ title, meta, icon: Icon, children, className = '' }) {
  return <section className={`dashboard-panel ${className}`}>
    <div className="panel-heading">
      <div className="panel-title">{Icon && <Icon size={20} strokeWidth={1.8} aria-hidden="true" />}<h2>{title}</h2></div>
      {meta && <span>{meta}</span>}
    </div>
    {children}
  </section>;
}

function ServicePanel() {
  return <Panel title="预约服务" meta="多方参与 · 便捷预约" icon={ClipboardList}>
    <div className="service-list">{SERVICE_ITEMS.map(({ icon, title, detail }) => {
      const Icon = ICONS[icon];
      return <div className="service-row" key={title}>
        <Icon size={32} strokeWidth={1.7} aria-hidden="true" />
        <div><strong>{title}</strong><span>{detail}</span></div>
      </div>;
    })}</div>
  </Panel>;
}

function DistributionPanel() {
  const max = Math.max(...AREA_DISTRIBUTION.map(([, value]) => value));
  return <Panel title="区域收运分布" meta="本月完成车次" icon={Route}>
    <div className="bar-list">{AREA_DISTRIBUTION.map(([name, value]) => <div className="bar-row" key={name}>
      <span>{name}</span><div className="bar-track"><i style={{ width: `${(value / max) * 100}%` }} /></div><b>{value}</b>
    </div>)}</div>
  </Panel>;
}

function ExecutionPanel() {
  return <Panel title="收运执行" meta="今日任务 · 单" icon={Truck}>
    <div className="execution-grid">
      {EXECUTION_METRICS.map(({ icon, value, label }) => {
        const Icon = ICONS[icon];
        return <div key={label}><Icon size={28} aria-hidden="true" /><strong>{value}</strong><span>{label}</span></div>;
      })}
    </div>
  </Panel>;
}

function TrackingPanel() {
  return <Panel title="清运任务追踪" meta="全流程可查 · 实时记录" icon={PackageCheck} className="tracking-panel">
    <div className="tracking-meta"><span>示例任务　KS-0916-028</span><span>预约收集点 → 接收场所</span></div>
    <div className="tracking-steps">{TRACKING_STEPS.map((step, index) => <div className={`tracking-step ${index < 4 ? 'is-done' : ''}`} key={step}>
      <span>{index < 4 ? <CheckCircle2 size={22} /> : <i />}</span><b>{step}</b>
    </div>)}</div>
    <div className="tracking-media"><div><strong>装修装修垃圾</strong><span>规范清运</span></div><Truck size={52} strokeWidth={1.35} aria-hidden="true" /></div>
  </Panel>;
}

function ProcessBar() {
  return <nav className="process-bar" aria-label="清运流程">{PROCESS_STEPS.map(([label, icon], index) => {
    const Icon = ICONS[icon];
    return <React.Fragment key={label}>
      <div className="process-step"><span><Icon size={21} strokeWidth={1.6} /></span><b>{label}</b></div>
      {index < PROCESS_STEPS.length - 1 && <i aria-hidden="true">›</i>}
    </React.Fragment>;
  })}</nav>;
}

function DashboardOverlay() {
  return <div className="dashboard-overlay">
    <StatStrip />
    <aside className="dashboard-rail dashboard-rail-left"><ServicePanel /><DistributionPanel /></aside>
    <aside className="dashboard-rail dashboard-rail-right"><ExecutionPanel /><TrackingPanel /></aside>
    <ProcessBar />
  </div>;
}

export default function App() {
  return <main className="map-app"><MapView /><Header /><DashboardOverlay /></main>;
}
