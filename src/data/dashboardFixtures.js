export const STAT_ITEMS = [
  { field: 'monthlyCollectionWeight', fractionDigits: 2, label: '本月收运量', unit: '吨', icon: 'recycle' },
  { field: 'monthlyCompletedTrips', label: '本月完成车次', unit: '车次', icon: 'truck' },
  { field: 'servedCommunityCount', label: '服务小区', unit: '个', icon: 'building' },
  { field: 'inServiceVehicleCount', label: '当前在运车辆', unit: '辆', icon: 'truck' }
];

export const SERVICE_ITEMS = [
  { icon: 'user', title: '居民预约', detail: '个人业主发起装修垃圾清运预约' },
  { icon: 'building', title: '物业申报', detail: '物业服务企业统一申报' },
  { icon: 'landmark', title: '区镇申报', detail: '区镇机构发起收运需求' }
];

export const EXECUTION_METRICS = [
  { field: 'pendingCount', icon: 'file', label: '待派单' },
  { field: 'inProgressCount', icon: 'truck', label: '执行中' },
  { field: 'completedCount', icon: 'check', label: '已完成' }
];

export const PROCESS_STEPS = [
  ['预约申请', 'file'],
  ['派单与备案', 'clipboard'],
  ['到场装载', 'recycle'],
  ['交付确认', 'check'],
  ['运输跟踪', 'truck'],
  ['到场回执', 'pin']
];
