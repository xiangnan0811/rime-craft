import type { RimeProject, ThemeStyle } from '@/types/config'
import { PRESETS } from './presets'
import { PRESET_THEMES } from './preset-themes'

export interface GalleryEntry {
  id: string;
  name: string;
  author: string;
  description: string;
  tags: string[];
  getProject: () => RimeProject;
  getTheme: () => ThemeStyle | undefined;
}

function findPreset(id: string) {
  return PRESETS.find((p) => p.id === id)
}

function findTheme(name: string) {
  return PRESET_THEMES.find((t) => t.name === name)
}

export const GALLERY_ENTRIES: GalleryEntry[] = [
  {
    id: 'minimal-clean',
    name: '极简全拼',
    author: 'Rime Craft',
    description: '最简配置，适合初次接触 Rime 的用户。朙月拼音 + 默认主题。',
    tags: ['全拼', '入门', '简洁'],
    getProject: () => findPreset('minimal-pinyin')!.createProject(),
    getTheme: () => findTheme('Rime 默认'),
  },
  {
    id: 'flypy-nord',
    name: '小鹤双拼 + Nord',
    author: 'Rime Craft',
    description: '小鹤双拼配合 Nord 冷色调主题，适合双拼爱好者。',
    tags: ['双拼', '小鹤', 'Nord'],
    getProject: () => {
      const p = findPreset('double-pinyin')!.createProject()
      const theme = findTheme('Nord')
      if (theme) p.platformConfig.style = structuredClone(theme)
      return p
    },
    getTheme: () => findTheme('Nord'),
  },
  {
    id: 'rime-ice-full',
    name: '雾凇拼音全家桶',
    author: 'Rime Craft',
    description: '雾凇拼音 + Material Light 主题 + 常用应用设置，开箱即用。',
    tags: ['全拼', '雾凇', '功能齐全'],
    getProject: () => {
      const p = findPreset('rime-ice')!.createProject()
      const theme = findTheme('Material Light')
      if (theme) p.platformConfig.style = structuredClone(theme)
      return p
    },
    getTheme: () => findTheme('Material Light'),
  },
  {
    id: 'wubi-minimal',
    name: '五笔极客',
    author: 'Rime Craft',
    description: '五笔86最简配置，无多余功能，专注打字。',
    tags: ['五笔', '形码', '极简'],
    getProject: () => findPreset('wubi')!.createProject(),
    getTheme: () => findTheme('GitHub Light'),
  },
  {
    id: 'macos-native',
    name: 'macOS 原生风格',
    author: 'Rime Craft',
    description: '模仿 macOS 原生输入法外观，雾凇拼音方案。',
    tags: ['macOS', '原生', '全拼'],
    getProject: () => {
      const p = findPreset('rime-ice')!.createProject()
      const theme = findTheme('macOS Native')
      if (theme) p.platformConfig.style = structuredClone(theme)
      return p
    },
    getTheme: () => findTheme('macOS Native'),
  },
  {
    id: 'dracula-flypy',
    name: '暗色双拼',
    author: 'Rime Craft',
    description: '小鹤双拼 + Dracula 暗色主题，适合暗色系桌面。',
    tags: ['双拼', '暗色', 'Dracula'],
    getProject: () => {
      const p = findPreset('double-pinyin')!.createProject()
      const theme = findTheme('Dracula')
      if (theme) p.platformConfig.style = structuredClone(theme)
      return p
    },
    getTheme: () => findTheme('Dracula'),
  },
]
