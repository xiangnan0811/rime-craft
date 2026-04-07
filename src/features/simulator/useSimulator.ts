import { useMemo } from 'react'
import { SAMPLE_WORDS } from '@/data/sample-words'

interface SimulatorResult {
  candidates: string[];
  pinyinDisplay: string;
}

/**
 * Simple prefix-matching simulator.
 * Returns candidates whose pinyin starts with the input.
 */
export function useSimulator(input: string, pageSize: number = 5): SimulatorResult {
  return useMemo(() => {
    const trimmed = input.toLowerCase().trim()
    if (!trimmed) {
      return { candidates: [], pinyinDisplay: '' }
    }

    const matched = SAMPLE_WORDS
      .filter((w) => w.pinyin.startsWith(trimmed))
      .slice(0, pageSize)
      .map((w) => w.text)

    // Deduplicate
    const seen = new Set<string>()
    const unique = matched.filter((t) => {
      if (seen.has(t)) return false
      seen.add(t)
      return true
    })

    return {
      candidates: unique,
      pinyinDisplay: trimmed,
    }
  }, [input, pageSize])
}
