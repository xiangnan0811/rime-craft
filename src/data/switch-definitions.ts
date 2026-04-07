export interface SwitchDefinition {
  name: string;
  label: string;
  description: string;
  defaultReset: number;
  states: [string, string];
}

export const SWITCH_DEFINITIONS: SwitchDefinition[] = [
  { name: 'emoji', label: 'Emoji', description: '输入时显示 Emoji 候选', defaultReset: 1, states: ['关', '开'] },
  { name: 'simplification', label: '简繁转换', description: '输出简体/繁体中文', defaultReset: 1, states: ['漢字', '汉字'] },
  { name: 'full_shape', label: '全角/半角', description: '全角模式输出全角字符', defaultReset: 0, states: ['半角', '全角'] },
  { name: 'ascii_punct', label: '中英标点', description: '切换中文标点和英文标点', defaultReset: 0, states: ['中文', '英文'] },
]
