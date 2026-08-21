export type Settings = Record<string, string | number | boolean>

export interface SettingsItem {
  type: 'switch' | 'seg' | 'select' | 'number'
  key: string
  label: string
  desc?: string
  min?: number
  max?: number
  depends?: string
  options?: (string | [string | number, string])[]
}
export interface SettingsGroup { title: string; items: SettingsItem[] }
export interface SettingsCategory { key: string; label: string; icon: string; groups: SettingsGroup[] }

export const SETTINGS_DEFAULTS: Settings = {
  restoreTabs: true, autoConnect: false, closeConfirm: true, maxTabs: 20, uiLang: 'zh-CN',
  msgLimit: 5000, timeFormat: 'ms', autoScroll: true, wrapLines: true, hexUppercase: true, hexCols: 16,
  defaultEnc: 'UTF-8', lfcrDefault: false, sendAfterClear: true, historyLimit: 50, historyPersist: false, quickTagsCount: 5,
  autoReconnect: false, reconnectDelay: 3, reconnectMax: 5, connTimeout: 3000, keepalive: false, udpRetry: false,
  exportFormat: 'TXT', autoLog: false, logRetention: 30, logLevel: 'info'
}

export const SETTINGS_SCHEMA: SettingsCategory[] = [
  { key: 'general', label: '通用', icon: 'sliders', groups: [
    { title: '会话', items: [
      { type: 'switch', key: 'restoreTabs', label: '启动时恢复上次会话', desc: '重启后保留标签与连接配置' },
      { type: 'switch', key: 'autoConnect', label: '启动时自动连接', desc: '对上次会话中的活动连接自动重连' },
      { type: 'switch', key: 'closeConfirm', label: '关闭标签时确认', desc: '关闭已连接的标签前弹出确认' },
      { type: 'number', key: 'maxTabs', label: '标签数量上限', min: 1, max: 50 },
      { type: 'select', key: 'uiLang', label: '界面语言', options: [['zh-CN', '简体中文'], ['en', 'English']] }
    ] }
  ] },
  { key: 'messages', label: '消息', icon: 'copy', groups: [
    { title: '消息流', items: [
      { type: 'select', key: 'msgLimit', label: '单标签消息上限', options: [[1000, '1000 条'], [5000, '5000 条'], [10000, '10000 条']] },
      { type: 'select', key: 'timeFormat', label: '时间戳格式', options: [['ms', 'HH:mm:ss.mmm'], ['s', 'HH:mm:ss']] },
      { type: 'switch', key: 'autoScroll', label: '自动滚动到底部', desc: '新消息到达时跟随滚动' },
      { type: 'switch', key: 'wrapLines', label: '长消息自动换行' }
    ] },
    { title: 'HEX 显示', items: [
      { type: 'switch', key: 'hexUppercase', label: 'HEX 大写显示', desc: '十六进制字节使用大写字母' },
      { type: 'select', key: 'hexCols', label: '每行字节数', options: [[8, '8 字节'], [16, '16 字节'], [32, '32 字节']] }
    ] }
  ] },
  { key: 'send', label: '发送', icon: 'send', groups: [
    { title: '发送', items: [
      { type: 'seg', key: 'defaultEnc', label: '默认发送编码', options: ['ASCII', 'UTF-8', 'GBK'] },
      { type: 'switch', key: 'lfcrDefault', label: '新建连接 LF→CR 默认开启' },
      { type: 'switch', key: 'sendAfterClear', label: '发送后清空输入框' }
    ] },
    { title: '发送历史', items: [
      { type: 'select', key: 'historyLimit', label: '历史保留条数', options: [[20, '20 条'], [50, '50 条'], [100, '100 条']] },
      { type: 'switch', key: 'historyPersist', label: '跨会话保留', desc: '重启后仍可 Ctrl+↑↓ 回溯' },
      { type: 'select', key: 'quickTagsCount', label: '快捷指令标签数量', options: [[3, '3 个'], [5, '5 个'], [8, '8 个']] }
    ] }
  ] },
  { key: 'connection', label: '连接', icon: 'network', groups: [
    { title: 'TCP', items: [
      { type: 'switch', key: 'autoReconnect', label: '自动重连', desc: '连接意外断开后自动重试' },
      { type: 'number', key: 'reconnectDelay', label: '重连间隔（秒）', min: 1, max: 60, depends: 'autoReconnect' },
      { type: 'number', key: 'reconnectMax', label: '最大重试次数', min: 0, max: 99, depends: 'autoReconnect' },
      { type: 'select', key: 'connTimeout', label: '连接超时', options: [[1000, '1 秒'], [3000, '3 秒'], [5000, '5 秒'], [10000, '10 秒']] },
      { type: 'switch', key: 'keepalive', label: 'TCP Keepalive', desc: '定期发送探测包保持连接' }
    ] },
    { title: 'UDP', items: [
      { type: 'switch', key: 'udpRetry', label: '绑定失败自动重试' }
    ] }
  ] },
  { key: 'log', label: '日志与导出', icon: 'history', groups: [
    { title: '导出', items: [
      { type: 'seg', key: 'exportFormat', label: '消息导出格式', options: ['TXT', 'JSON', 'CSV'] },
      { type: 'switch', key: 'autoLog', label: '自动保存会话日志' }
    ] },
    { title: '日志', items: [
      { type: 'select', key: 'logRetention', label: '日志保留时长', options: [[7, '7 天'], [30, '30 天'], [90, '90 天']] },
      { type: 'select', key: 'logLevel', label: '日志级别', options: [['error', '错误'], ['warn', '警告'], ['info', '信息'], ['debug', '调试']] }
    ] }
  ] }
]

const STORAGE_KEY = 'netassist.settings'

export function saveSettingsToStorage(s: Settings): void {
  try { localStorage.setItem(STORAGE_KEY, JSON.stringify(s)) } catch { /* 忽略配额等错误 */ }
}

export function loadSettingsFromStorage(): Settings {
  const base: Settings = { ...SETTINGS_DEFAULTS }
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (raw) {
      const parsed = JSON.parse(raw) as Partial<Settings>
      Object.assign(base, parsed)
    }
  } catch { /* 坏 JSON 忽略，用默认 */ }
  return base
}
