import { ALL_SCHEMAS } from './schema-data'

export interface SchemaCompareData {
  id: string;
  name: string;
  author: string;
  inputMethod: '全拼' | '双拼' | '形码' | '音形混合';
  dictSize: string;
  smartLevel: '基础' | '中等' | '高';
  auxiliaryCode: string;
  features: string[];
  platforms: string[];
  difficulty: '简单' | '中等' | '困难';
  recommendation: string;
  presetId?: string;
}

const TYPE_TO_INPUT_METHOD: Record<string, SchemaCompareData['inputMethod']> = {
  full_pinyin: '全拼',
  double_pinyin: '双拼',
  shape: '形码',
  mixed: '音形混合',
}

export const SCHEMA_COMPARE_DATA: SchemaCompareData[] = ALL_SCHEMAS.map((s) => ({
  id: s.id,
  name: s.name,
  author: s.author,
  inputMethod: TYPE_TO_INPUT_METHOD[s.type] ?? '全拼',
  dictSize: s.compare.dictSize,
  smartLevel: s.compare.smartLevel,
  auxiliaryCode: s.compare.auxiliaryCode,
  features: s.compare.features,
  platforms: s.compare.platforms,
  difficulty: s.compare.difficulty,
  recommendation: s.compare.recommendation,
  ...(s.integration.presetId && { presetId: s.integration.presetId }),
}))
