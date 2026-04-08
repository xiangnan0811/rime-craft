export interface SpecialTriggerDefinition {
  id: string;
  label: string;
  description: string;
  defaultCode: string;
  category: 'datetime' | 'tool' | 'stats';
}

export const SPECIAL_TRIGGER_DEFINITIONS: SpecialTriggerDefinition[] = [
  { id: 'date', label: '日期', description: '输出当前日期', defaultCode: '/rq', category: 'datetime' },
  { id: 'time', label: '时间', description: '输出当前时间', defaultCode: '/sj', category: 'datetime' },
  { id: 'week', label: '星期', description: '输出当前星期', defaultCode: '/xq', category: 'datetime' },
  { id: 'lunar', label: '农历', description: '输出农历日期', defaultCode: '/nl', category: 'datetime' },
  { id: 'solar_term', label: '节气', description: '输出当前节气', defaultCode: '/jq', category: 'datetime' },
  { id: 'holiday', label: '节日', description: '输出近期节日', defaultCode: '/jr', category: 'datetime' },
  { id: 'timestamp', label: '时间戳', description: '输出 Unix 时间戳', defaultCode: '/tt', category: 'datetime' },
  { id: 'calculator', label: '计算器', description: '数学表达式计算', defaultCode: 'V', category: 'tool' },
  { id: 'unicode', label: 'Unicode', description: 'Unicode 字符输入', defaultCode: 'U', category: 'tool' },
  { id: 'stats_today', label: '今日统计', description: '显示今日输入统计', defaultCode: '/rtj', category: 'stats' },
  { id: 'stats_total', label: '总计统计', description: '显示累计输入统计', defaultCode: '/tj', category: 'stats' },
]

export const TRIGGER_CATEGORIES = [
  { id: 'datetime', label: '日期时间' },
  { id: 'tool', label: '工具' },
  { id: 'stats', label: '统计' },
] as const
