export interface SwitchDefinition {
  name: string;
  label: string;
  description: string;
  defaultReset: number;
  states: [string, string];
  category: 'basic' | 'conversion' | 'input' | 'display' | 'encoding' | 'comment';
}

export interface MultiStateSwitchDefinition {
  options: string[];
  label: string;
  description: string;
  defaultReset: number;
  states: string[];
  category: 'basic' | 'conversion' | 'input' | 'display' | 'encoding' | 'comment';
}

export type AnySwitchDefinition = SwitchDefinition | MultiStateSwitchDefinition;

export function isBinarySwitch(def: AnySwitchDefinition): def is SwitchDefinition {
  return 'name' in def;
}

export const SWITCH_DEFINITIONS: AnySwitchDefinition[] = [
  { name: 'emoji', label: 'Emoji', description: '输入时显示 Emoji 候选', defaultReset: 1, states: ['关', '开'], category: 'basic' },
  { name: 'full_shape', label: '全角/半角', description: '全角模式输出全角字符', defaultReset: 0, states: ['半角', '全角'], category: 'basic' },
  { name: 'ascii_punct', label: '中英标点', description: '切换中文标点和英文标点', defaultReset: 0, states: ['中文', '英文'], category: 'basic' },
  { options: ['s2s', 's2t', 's2hk', 's2tw'], label: '简繁转换', description: '选择输出字形：简体、通用繁体、港繁、台繁', defaultReset: 0, states: ['简体', '通繁', '港繁', '臺繁'], category: 'conversion' },
  { name: 'prediction', label: '预测输入', description: '根据上下文预测下一个词', defaultReset: 0, states: ['关', '开'], category: 'input' },
  { name: 'abbrev', label: '简码', description: '启用简码输入', defaultReset: 1, states: ['关', '开'], category: 'input' },
  { name: 'chinese_english', label: '翻译模式', description: '输入中文显示对应英文翻译', defaultReset: 0, states: ['关', '开'], category: 'input' },
  { name: 'charset_filter', label: '字集过滤', description: '限制候选词字符集范围', defaultReset: 0, states: ['大字集', '小字集'], category: 'display' },
  { name: 'char_priority', label: '候选排序', description: '优先显示单字或词组', defaultReset: 0, states: ['词组先', '单字先'], category: 'display' },
  { name: 'super_tips', label: 'Tips 提示', description: '显示 Tips 扩展提示信息', defaultReset: 0, states: ['关', '开'], category: 'display' },
  { options: ['raw_input', 'tone_display', 'full_pinyin'], label: '编码显示', description: '候选栏中显示的编码格式', defaultReset: 0, states: ['原编码', '有声调', '无声调'], category: 'encoding' },
  { options: ['comment_off', 'tone_hint', 'toneless_hint'], label: '注释模式', description: '候选词注释显示方式', defaultReset: 0, states: ['注释关', '有声调', '无声调'], category: 'comment' },
]

export const SWITCH_CATEGORIES = [
  { id: 'basic', label: '基础' },
  { id: 'conversion', label: '繁简转换' },
  { id: 'input', label: '输入增强' },
  { id: 'display', label: '显示控制' },
  { id: 'encoding', label: '编码显示' },
  { id: 'comment', label: '注释模式' },
] as const
