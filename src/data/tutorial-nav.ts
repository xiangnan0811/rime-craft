export interface TutorialSection {
  title: string;
  items: TutorialItem[];
}

export interface TutorialItem {
  slug: string;
  title: string;
}

export const TUTORIAL_NAV: TutorialSection[] = [
  {
    title: '入门指南',
    items: [
      { slug: 'what-is-rime', title: 'Rime 是什么' },
      { slug: 'installation', title: '安装教程' },
      { slug: 'first-deploy', title: '第一次部署' },
      { slug: 'config-structure', title: '配置文件结构' },
    ],
  },
  {
    title: '配置详解',
    items: [
      { slug: 'schema-manager', title: '输入方案管理' },
      { slug: 'candidate-settings', title: '候选词设置' },
      { slug: 'key-bindings', title: '按键绑定' },
      { slug: 'fuzzy-pinyin', title: '模糊音配置' },
      { slug: 'ascii-mode', title: '中英文切换' },
      { slug: 'punctuation', title: '标点符号映射' },
      { slug: 'dictionary', title: '自定义词库' },
      { slug: 'switches', title: '开关与杂项' },
    ],
  },
]

/** Flatten all items for lookup */
export function findTutorialBySlug(slug: string): TutorialItem | undefined {
  for (const section of TUTORIAL_NAV) {
    const item = section.items.find((i) => i.slug === slug)
    if (item) return item
  }
  return undefined
}
