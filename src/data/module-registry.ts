import { lazy } from 'react'
import type { EditorModule, RimeProject } from '@/types/config'

// ─── Types ─────────────────────────────────────────────

export type ModuleGroup = 'basic' | 'input' | 'auxiliary' | 'appearance'

export type SchemaApplicability =
  | { type: 'universal' }
  | { type: 'schemas'; ids: string[] }
  | { type: 'capability'; cap: string }

export interface ModuleDefinition {
  id: EditorModule
  label: string
  group: ModuleGroup
  tutorialSlug?: string
  applicability: SchemaApplicability
  getModifiedCount?: (project: RimeProject) => number
}

export interface ModuleGroupInfo {
  id: ModuleGroup
  label: string
  order: number
}

// ─── Group definitions ─────────────────────────────────

export const MODULE_GROUPS: ModuleGroupInfo[] = [
  { id: 'basic', label: '基本设置', order: 0 },
  { id: 'input', label: '输入行为', order: 1 },
  { id: 'auxiliary', label: '辅助功能', order: 2 },
  { id: 'appearance', label: '外观与显示', order: 3 },
]

// ─── Module definitions ────────────────────────────────

export const MODULE_REGISTRY: ModuleDefinition[] = [
  // --- basic ---
  {
    id: 'schema-manager',
    label: '输入方案管理',
    group: 'basic',
    tutorialSlug: 'schema-manager',
    applicability: { type: 'universal' },
  },
  {
    id: 'candidate-settings',
    label: '候选词设置',
    group: 'basic',
    tutorialSlug: 'candidate-settings',
    applicability: { type: 'universal' },
  },
  {
    id: 'key-bindings',
    label: '按键绑定',
    group: 'basic',
    tutorialSlug: 'key-bindings',
    applicability: { type: 'universal' },
  },
  {
    id: 'switches',
    label: '开关与杂项',
    group: 'basic',
    tutorialSlug: 'switches',
    applicability: { type: 'universal' },
  },
  // --- input ---
  {
    id: 'fuzzy-pinyin',
    label: '模糊音规则',
    group: 'input',
    tutorialSlug: 'fuzzy-pinyin',
    applicability: { type: 'universal' },
  },
  {
    id: 'spelling-scheme',
    label: '拼写方案',
    group: 'input',
    tutorialSlug: 'spelling-scheme',
    applicability: { type: 'capability', cap: 'multi-spelling' },
  },
  {
    id: 'auxiliary-code',
    label: '辅助码配置',
    group: 'input',
    tutorialSlug: 'auxiliary-code-config',
    applicability: { type: 'capability', cap: 'auxiliary-code' },
  },
  {
    id: 'reverse-lookup',
    label: '反查与筛选',
    group: 'input',
    tutorialSlug: 'reverse-lookup',
    applicability: { type: 'capability', cap: 'reverse-lookup' },
  },
  // --- auxiliary ---
  {
    id: 'punctuation',
    label: '标点符号映射',
    group: 'auxiliary',
    tutorialSlug: 'punctuation',
    applicability: { type: 'universal' },
  },
  {
    id: 'dictionary',
    label: '词典管理',
    group: 'auxiliary',
    tutorialSlug: 'dictionary',
    applicability: { type: 'universal' },
  },
  {
    id: 'lua-extensions',
    label: 'Lua 扩展',
    group: 'auxiliary',
    tutorialSlug: 'lua-extensions',
    applicability: { type: 'capability', cap: 'lua-extensions' },
  },
  // --- appearance ---
  {
    id: 'ascii-mode',
    label: '中英文切换',
    group: 'appearance',
    tutorialSlug: 'ascii-mode',
    applicability: { type: 'universal' },
  },
  {
    id: 'candidate-display',
    label: '候选词显示',
    group: 'appearance',
    tutorialSlug: 'candidate-display',
    applicability: { type: 'universal' },
  },
  {
    id: 'comment-hints',
    label: '注释与提示',
    group: 'appearance',
    tutorialSlug: 'comment-hints',
    applicability: { type: 'capability', cap: 'super-comment' },
  },
]

// ─── Component lazy-load map ───────────────────────────

export const MODULE_COMPONENTS: Record<EditorModule, React.LazyExoticComponent<React.ComponentType>> = {
  'schema-manager': lazy(() => import('@/features/editor/modules/SchemaManager').then(m => ({ default: m.SchemaManager }))),
  'candidate-settings': lazy(() => import('@/features/editor/modules/CandidateSettings').then(m => ({ default: m.CandidateSettings }))),
  'key-bindings': lazy(() => import('@/features/editor/modules/KeyBindings').then(m => ({ default: m.KeyBindings }))),
  'switches': lazy(() => import('@/features/editor/modules/Switches').then(m => ({ default: m.Switches }))),
  'fuzzy-pinyin': lazy(() => import('@/features/editor/modules/FuzzyPinyin').then(m => ({ default: m.FuzzyPinyin }))),
  'spelling-scheme': lazy(() => import('@/features/editor/modules/SpellingScheme').then(m => ({ default: m.SpellingScheme }))),
  'auxiliary-code': lazy(() => import('@/features/editor/modules/AuxiliaryCode').then(m => ({ default: m.AuxiliaryCode }))),
  'reverse-lookup': lazy(() => import('@/features/editor/modules/ReverseLookup').then(m => ({ default: m.ReverseLookup }))),
  'punctuation': lazy(() => import('@/features/editor/modules/Punctuation').then(m => ({ default: m.Punctuation }))),
  'dictionary': lazy(() => import('@/features/editor/modules/Dictionary').then(m => ({ default: m.Dictionary }))),
  'lua-extensions': lazy(() => import('@/features/editor/modules/LuaExtensions').then(m => ({ default: m.LuaExtensions }))),
  'ascii-mode': lazy(() => import('@/features/editor/modules/AsciiMode').then(m => ({ default: m.AsciiMode }))),
  'candidate-display': lazy(() => import('@/features/editor/modules/CandidateDisplay').then(m => ({ default: m.CandidateDisplay }))),
  'comment-hints': lazy(() => import('@/features/editor/modules/CommentHints').then(m => ({ default: m.CommentHints }))),
}

// ─── Helper functions ──────────────────────────────────

/** 根据方案能力过滤出适用的模块 */
export function getModulesForSchema(capabilities: string[]): ModuleDefinition[] {
  return MODULE_REGISTRY.filter((mod) => {
    const a = mod.applicability
    if (a.type === 'universal') return true
    if (a.type === 'capability') return capabilities.includes(a.cap)
    if (a.type === 'schemas') return false
    return false
  })
}

/** 按分组组织模块 */
export function groupModules(modules: ModuleDefinition[]): Map<ModuleGroup, ModuleDefinition[]> {
  const grouped = new Map<ModuleGroup, ModuleDefinition[]>()
  for (const group of MODULE_GROUPS) {
    const items = modules.filter((m) => m.group === group.id)
    if (items.length > 0) grouped.set(group.id, items)
  }
  return grouped
}
