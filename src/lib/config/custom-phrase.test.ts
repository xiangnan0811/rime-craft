import { describe, it, expect } from 'vitest'
import { parseCustomPhrases, serializeCustomPhrases } from './custom-phrase'

describe('parseCustomPhrases', () => {
  it('parses valid TSV lines', () => {
    const input = '直接\tzhijie\t1\n输入法\tshurufa\t2'
    const result = parseCustomPhrases(input)
    expect(result).toEqual([
      { text: '直接', code: 'zhijie', weight: 1 },
      { text: '输入法', code: 'shurufa', weight: 2 },
    ])
  })

  it('skips comments and empty lines', () => {
    const input = '# comment\n\n直接\tzhijie\t1\n# another comment'
    const result = parseCustomPhrases(input)
    expect(result).toHaveLength(1)
    expect(result[0]!.text).toBe('直接')
  })

  it('defaults weight to 0 when missing', () => {
    const input = '测试\tceshi'
    const result = parseCustomPhrases(input)
    expect(result[0]!.weight).toBe(0)
  })

  it('returns empty array for empty input', () => {
    expect(parseCustomPhrases('')).toEqual([])
    expect(parseCustomPhrases('# only comments')).toEqual([])
  })
})

describe('serializeCustomPhrases', () => {
  it('serializes phrases to TSV with header', () => {
    const phrases = [
      { text: '直接', code: 'zhijie', weight: 1 },
      { text: '输入法', code: 'shurufa', weight: 2 },
    ]
    const result = serializeCustomPhrases(phrases)
    expect(result).toContain('直接\tzhijie\t1')
    expect(result).toContain('输入法\tshurufa\t2')
    expect(result.startsWith('#')).toBe(true)
  })

  it('round-trips correctly', () => {
    const original = [
      { text: '你好', code: 'nihao', weight: 10 },
      { text: '世界', code: 'shijie', weight: 5 },
    ]
    const serialized = serializeCustomPhrases(original)
    const parsed = parseCustomPhrases(serialized)
    expect(parsed).toEqual(original)
  })
})
