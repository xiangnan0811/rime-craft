import type { SpellingScheme, AuxiliaryCodeScheme } from '@/types/config'

export interface SchemaInfo {
  id: string;
  name: string;
  description: string;
  type: 'full_pinyin' | 'double_pinyin' | 'shape' | 'mixed';
  capabilities: string[];
  availableSpellingSchemes?: SpellingScheme[];
  availableAuxiliaryCodes?: AuxiliaryCodeScheme[];
  customSwitchNames?: string[];
}

export const SCHEMA_REGISTRY: SchemaInfo[] = [
  {
    id: 'rime_ice',
    name: '雾凇拼音',
    description: '功能齐全的全拼方案，词库丰富，社区活跃',
    type: 'full_pinyin',
    capabilities: ['special-input'],
  },
  {
    id: 'double_pinyin_flypy',
    name: '小鹤双拼',
    description: '最流行的双拼方案之一，键位分布合理',
    type: 'double_pinyin',
    capabilities: [],
  },
  {
    id: 'wanxiang',
    name: '万象拼音',
    description: '新一代拼音方案，支持直接辅助码',
    type: 'full_pinyin',
    capabilities: [
      'multi-spelling', 'auxiliary-code', 'reverse-lookup',
      'special-input', 'lua-extensions', 'super-comment',
    ],
    availableSpellingSchemes: ['full_pinyin', 'flypy', 'zrm', 'mspy', 'sogou', 'abc', 'ziguang'],
    availableAuxiliaryCodes: ['moqi', 'hexing', 'zrm', 'tiger', 'wubi', 'cangjie', 'simple_he', 'hanxin'],
    customSwitchNames: [
      'chinese_english', 'prediction', 'abbrev',
      'charset_filter', 'char_priority', 'super_tips',
    ],
  },
  {
    id: 'luna_pinyin',
    name: '朙月拼音',
    description: 'Rime 内置全拼方案，轻量稳定',
    type: 'full_pinyin',
    capabilities: [],
  },
  {
    id: 'double_pinyin',
    name: '自然码双拼',
    description: '经典双拼方案',
    type: 'double_pinyin',
    capabilities: [],
  },
  {
    id: 'double_pinyin_mspy',
    name: '微软双拼',
    description: '微软拼音使用的双拼方案',
    type: 'double_pinyin',
    capabilities: [],
  },
  {
    id: 'wubi86',
    name: '五笔86',
    description: '经典五笔字型方案',
    type: 'shape',
    capabilities: [],
  },
  {
    id: 'cangjie5',
    name: '仓颉五代',
    description: '经典形码方案',
    type: 'shape',
    capabilities: [],
  },
]

/** 查找方案是否具有某能力 */
export function schemaHasCapability(schemaId: string, capability: string): boolean {
  const schema = SCHEMA_REGISTRY.find((s) => s.id === schemaId)
  return schema?.capabilities.includes(capability) ?? false
}

/** 获取方案的所有能力 */
export function getSchemaCapabilities(schemaId: string): string[] {
  return SCHEMA_REGISTRY.find((s) => s.id === schemaId)?.capabilities ?? []
}
