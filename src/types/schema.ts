export interface SchemaDetail {
  id: string
  name: string
  type: 'full_pinyin' | 'double_pinyin' | 'shape' | 'mixed'
  description: string
  introduction: string
  author: string
  links: SchemaLinks
  compare: SchemaCompareInfo
  visuals: SchemaVisuals
  community: SchemaCommunity
  learningResources: LearningResource[]
  integration: SchemaIntegration
}

export interface SchemaLinks {
  official: string | null
  repository: string | null
  documentation: string | null
  community: CommunityLink[]
}

export interface CommunityLink {
  label: string
  url: string
}

export interface SchemaCompareInfo {
  dictSize: string
  smartLevel: '基础' | '中等' | '高'
  auxiliaryCode: string
  features: string[]
  platforms: string[]
  difficulty: '简单' | '中等' | '困难'
  recommendation: string
}

export interface SchemaVisuals {
  screenshots: string[]
  keyboardLayout: KeyboardLayoutData | null
}

export interface KeyboardLayoutData {
  name: string
  rows: KeyMapping[][]
}

export interface KeyMapping {
  key: string
  initial: string | null
  final: string
  isSpecial?: boolean
  isDualRole?: boolean
}

export interface SchemaCommunity {
  updateFrequency: string
  stars: string
  reputation: string
}

export interface LearningResource {
  title: string
  url: string
}

export interface SchemaIntegration {
  presetId: string | null
  capabilities: string[]
  availableSpellingSchemes: string[] | null
  availableAuxiliaryCodes: string[] | null
  customSwitchNames: string[] | null
}
