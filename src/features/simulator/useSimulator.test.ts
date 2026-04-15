import { describe, it, expect } from 'vitest'
import { renderHook } from '@testing-library/react'
import { useSimulator } from './useSimulator'

describe('useSimulator', () => {
  it('returns empty candidates for empty input', () => {
    const { result } = renderHook(() => useSimulator(''))
    expect(result.current.candidates).toEqual([])
    expect(result.current.pinyinDisplay).toBe('')
  })

  it('returns empty candidates for whitespace-only input', () => {
    const { result } = renderHook(() => useSimulator('   '))
    expect(result.current.candidates).toEqual([])
    expect(result.current.pinyinDisplay).toBe('')
  })

  it('returns matching candidates for prefix input', () => {
    const { result } = renderHook(() => useSimulator('nihao'))
    expect(result.current.candidates).toContain('你好')
    expect(result.current.pinyinDisplay).toBe('nihao')
  })

  it('is case-insensitive', () => {
    const { result } = renderHook(() => useSimulator('NiHao'))
    expect(result.current.candidates).toContain('你好')
  })

  it('limits results by pageSize', () => {
    // Use a short prefix that matches many words
    const { result } = renderHook(() => useSimulator('sh', 2))
    expect(result.current.candidates.length).toBeLessThanOrEqual(2)
  })

  it('returns no duplicates', () => {
    // 'ta' matches both '他' and '她' which have the same pinyin
    const { result } = renderHook(() => useSimulator('ta'))
    const unique = new Set(result.current.candidates)
    expect(unique.size).toBe(result.current.candidates.length)
  })

  it('returns empty for non-matching input', () => {
    const { result } = renderHook(() => useSimulator('zzzzzzz'))
    expect(result.current.candidates).toEqual([])
  })

  it('uses default pageSize of 5', () => {
    // 'shi' matches many words: 是, 十, 时间, 世界, 事情, 使用, ...
    const { result } = renderHook(() => useSimulator('shi'))
    expect(result.current.candidates.length).toBeLessThanOrEqual(5)
  })
})
