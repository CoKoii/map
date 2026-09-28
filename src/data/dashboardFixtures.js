export const STAT_ITEMS = [
  { label: '本月收运量', value: '12,680', unit: '吨', icon: 'recycle' },
  { label: '本月完成车次', value: '2,416', unit: '车次', icon: 'truck' },
  { label: '服务小区', value: '368', unit: '个', icon: 'building' },
  { label: '当前在运车辆', value: '86', unit: '辆', icon: 'truck' }
];

export const SERVICE_ITEMS = [
  { icon: 'user', title: '居民预约', detail: '个人业主发起装修垃圾清运预约' },
  { icon: 'building', title: '物业申报', detail: '物业服务企业统一申报' },
  { icon: 'landmark', title: '区镇申报', detail: '区镇机构发起收运需求' }
];

export const AREA_DISTRIBUTION = [
  ['玉山镇', 720],
  ['开发区', 610],
  ['花桥经济开发区', 486],
  ['张浦镇', 320]
];

export const EXECUTION_METRICS = [
  { icon: 'file', value: '18', label: '待派单' },
  { icon: 'truck', value: '86', label: '执行中' },
  { icon: 'check', value: '216', label: '已完成' }
];

export const TRACKING_STEPS = ['预约提交', '车辆到场', '交付确认', '运输中', '到场回执'];

export const PROCESS_STEPS = [
  ['预约申请', 'file'],
  ['派单与备案', 'clipboard'],
  ['到场装载', 'recycle'],
  ['交付确认', 'check'],
  ['运输跟踪', 'truck'],
  ['到场回执', 'pin']
];
