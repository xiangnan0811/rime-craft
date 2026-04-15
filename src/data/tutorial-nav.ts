export interface TutorialSection {
  title: string
  items: TutorialItem[]
}

export interface TutorialItem {
  slug: string
  title: string
  aliases?: string[]
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
      { slug: 'candidate-display', title: '候选词显示' },
      { slug: 'key-bindings', title: '按键绑定' },
      { slug: 'fuzzy-pinyin', title: '模糊音配置' },
      { slug: 'spelling-scheme', title: '拼写方案' },
      { slug: 'ascii-mode', title: '中英文切换' },
      { slug: 'punctuation', title: '标点符号映射' },
      { slug: 'dictionary', title: '自定义词库' },
      { slug: 'switches', title: '开关与杂项' },
    ],
  },
  {
    title: '进阶技巧',
    items: [
      { slug: 'double-pinyin-guide', title: '双拼方案指南' },
      {
        slug: 'auxiliary-code-config',
        title: '辅助码详解',
        aliases: ['auxiliary-code'],
      },
      { slug: 'reverse-lookup', title: '反查与筛选' },
      { slug: 'comment-hints', title: '候选词注释与提示' },
      { slug: 'custom-dictionary', title: '词库制作与维护' },
      { slug: 'lua-extensions', title: 'Lua 扩展' },
      { slug: 'multi-device-sync', title: '多设备同步' },
    ],
  },
]

function matchesTutorialSlug(item: TutorialItem, slug: string): boolean {
  return item.slug === slug || item.aliases?.includes(slug) === true
}

export function findTutorialBySlug(slug: string): TutorialItem | undefined {
  for (const section of TUTORIAL_NAV) {
    const item = section.items.find((candidate) =>
      matchesTutorialSlug(candidate, slug),
    )
    if (item) return item
  }
  return undefined
}

export function resolveTutorialSlug(slug: string): string | undefined {
  return findTutorialBySlug(slug)?.slug
}
