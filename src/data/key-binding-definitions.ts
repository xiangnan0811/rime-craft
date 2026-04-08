export interface FunctionKeyDefinition {
  id: string;
  label: string;
  description: string;
  defaultAccept: string;
  defaultSend?: string;
  defaultToggle?: string;
  when: string;
  category: 'function' | 'navigation' | 'editing';
}

export const FUNCTION_KEY_DEFINITIONS: FunctionKeyDefinition[] = [
  { id: 'tab_next', label: 'Tab 音节跳转', description: '在多音节输入时循环切换到下一个音节', defaultAccept: 'Tab', defaultSend: 'Shift+Right', when: 'composing', category: 'navigation' },
  { id: 'ctrl_a', label: 'Ctrl+A 注释切换', description: '切换辅助码/声调注释显示', defaultAccept: 'Control+a', defaultToggle: 'tone_hint', when: 'always', category: 'function' },
  { id: 'ctrl_s', label: 'Ctrl+S 声调显示', description: '在输入码中显示声调标记', defaultAccept: 'Control+s', defaultToggle: 'tone_display', when: 'always', category: 'function' },
  { id: 'ctrl_e', label: 'Ctrl+E 翻译模式', description: '切换中英翻译模式', defaultAccept: 'Control+e', defaultToggle: 'chinese_english', when: 'always', category: 'function' },
  { id: 'ctrl_t', label: 'Ctrl+T Tips', description: '切换 Tips 提示开关', defaultAccept: 'Control+t', defaultToggle: 'super_tips', when: 'always', category: 'function' },
  { id: 'ctrl_g', label: 'Ctrl+G 字集', description: '切换大字集/小字集', defaultAccept: 'Control+g', defaultToggle: 'charset_filter', when: 'always', category: 'function' },
  { id: 'ctrl_j', label: 'Ctrl+J 左移排序', description: '手动将候选词向左移动一步', defaultAccept: 'Control+j', defaultSend: 'Shift+Left', when: 'has_menu', category: 'editing' },
  { id: 'ctrl_k', label: 'Ctrl+K 右移排序', description: '手动将候选词向右移动一步', defaultAccept: 'Control+k', defaultSend: 'Shift+Right', when: 'has_menu', category: 'editing' },
  { id: 'minus_pgup', label: '减号翻页', description: '使用减号键向上翻页', defaultAccept: 'minus', defaultSend: 'Page_Up', when: 'has_menu', category: 'navigation' },
  { id: 'equal_pgdn', label: '等号翻页', description: '使用等号键向下翻页', defaultAccept: 'equal', defaultSend: 'Page_Down', when: 'has_menu', category: 'navigation' },
]

export const FUNCTION_KEY_CATEGORIES = [
  { id: 'function', label: '功能切换' },
  { id: 'navigation', label: '导航' },
  { id: 'editing', label: '编辑' },
] as const
