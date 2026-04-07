import type { CustomPhrase } from '@/types/config'

/**
 * Parse custom_phrase.txt (TSV format):
 * # comment lines start with #
 * <text>\t<code>\t<weight>
 */
export function parseCustomPhrases(content: string): CustomPhrase[] {
  const phrases: CustomPhrase[] = []
  for (const line of content.split('\n')) {
    const trimmed = line.trim()
    if (!trimmed || trimmed.startsWith('#')) continue
    const parts = trimmed.split('\t')
    const text = parts[0]
    const code = parts[1]
    const weight = parts[2]
    if (text && code) {
      phrases.push({
        text,
        code,
        weight: weight ? Number(weight) : 0,
      })
    }
  }
  return phrases
}

/**
 * Serialize custom phrases to custom_phrase.txt format
 */
export function serializeCustomPhrases(phrases: CustomPhrase[]): string {
  const lines = ['# Rime custom phrase', '# <text>\t<code>\t<weight>']
  for (const p of phrases) {
    lines.push(`${p.text}\t${p.code}\t${p.weight}`)
  }
  return lines.join('\n') + '\n'
}
