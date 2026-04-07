import type { RimeProject } from '@/types/config'
import { createEmptyProject } from '@/lib/config/defaults'

export interface Preset {
  id: string;
  name: string;
  description: string;
  createProject: () => RimeProject;
}

export const PRESETS: Preset[] = [
  {
    id: 'minimal-pinyin',
    name: '极简拼音',
    description: '默认全拼，最少配置，适合快速上手',
    createProject() {
      const p = createEmptyProject()
      p.defaultConfig.schemaList = [{ schema: 'luna_pinyin' }]
      p.defaultConfig.pageSize = 5
      return p
    },
  },
  {
    id: 'double-pinyin',
    name: '双拼快手',
    description: '小鹤双拼 + 常用模糊音（前后鼻音），打字更快',
    createProject() {
      const p = createEmptyProject()
      p.defaultConfig.schemaList = [{ schema: 'double_pinyin_flypy' }]
      p.defaultConfig.pageSize = 9
      p.defaultConfig.selectKeys = '123456789'
      p.defaultConfig.asciiComposer.switchKey.shiftL = 'commit_code'
      p.schemaConfigs['double_pinyin_flypy'] = {
        schemaId: 'double_pinyin_flypy',
        fuzzyRules: [
          { ruleId: 'an_ang', enabled: true },
          { ruleId: 'en_eng', enabled: true },
          { ruleId: 'in_ing', enabled: true },
        ],
      }
      p.platformConfig.appOptions = {
        'com.apple.Terminal': { asciiMode: true },
        'com.microsoft.VSCode': { asciiMode: true },
      }
      return p
    },
  },
  {
    id: 'rime-ice',
    name: '雾凇拼音推荐',
    description: '雾凇拼音方案 + 9候选 + 推荐按键设置',
    createProject() {
      const p = createEmptyProject()
      p.defaultConfig.schemaList = [{ schema: 'rime_ice' }]
      p.defaultConfig.pageSize = 9
      p.defaultConfig.asciiComposer.switchKey.shiftL = 'commit_code'
      p.defaultConfig.asciiComposer.switchKey.capsLock = 'clear'
      p.platformConfig.appOptions = {
        'com.apple.Terminal': { asciiMode: true },
        'com.microsoft.VSCode': { asciiMode: true },
        'com.googlecode.iterm2': { asciiMode: true },
      }
      return p
    },
  },
]
