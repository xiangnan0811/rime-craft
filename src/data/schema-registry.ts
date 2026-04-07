export interface SchemaInfo {
  id: string;
  name: string;
  description: string;
  type: 'full_pinyin' | 'double_pinyin' | 'shape' | 'mixed';
}

export const SCHEMA_REGISTRY: SchemaInfo[] = [
  { id: 'rime_ice', name: '雾凇拼音', description: '功能齐全的全拼方案，词库丰富，社区活跃', type: 'full_pinyin' },
  { id: 'double_pinyin_flypy', name: '小鹤双拼', description: '最流行的双拼方案之一，键位分布合理', type: 'double_pinyin' },
  { id: 'wanxiang', name: '万象拼音', description: '新一代拼音方案，支持直接辅助码', type: 'full_pinyin' },
  { id: 'luna_pinyin', name: '朙月拼音', description: 'Rime 内置全拼方案，轻量稳定', type: 'full_pinyin' },
  { id: 'double_pinyin', name: '自然码双拼', description: '经典双拼方案', type: 'double_pinyin' },
  { id: 'double_pinyin_mspy', name: '微软双拼', description: '微软拼音使用的双拼方案', type: 'double_pinyin' },
  { id: 'wubi86', name: '五笔86', description: '经典五笔字型方案', type: 'shape' },
  { id: 'cangjie5', name: '仓颉五代', description: '经典形码方案', type: 'shape' },
]
