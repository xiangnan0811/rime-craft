import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { describe, expect, it } from 'vitest'

const contentDir = path.resolve(
  path.dirname(fileURLToPath(import.meta.url)),
)
const files = fs.readdirSync(contentDir).filter((file) => file.endsWith('.mdx'))

describe('content contract', () => {
  it('keeps tutorial cross-links resolvable', () => {
    for (const file of files) {
      const source = fs.readFileSync(path.join(contentDir, file), 'utf8')
      const links = [...source.matchAll(/\]\(\.\/([a-z0-9-]+)\)/g)].map(
        (match) => match[1],
      )

      for (const slug of links) {
        expect(
          fs.existsSync(path.join(contentDir, `${slug}.mdx`)),
          `${file} -> ${slug}.mdx`,
        ).toBe(true)
      }
    }
  })

  it('enforces the minimum content-depth contract', () => {
    for (const file of files) {
      const source = fs.readFileSync(path.join(contentDir, file), 'utf8')
      const details = (source.match(/<Details/g) ?? []).length
      const steps = (source.match(/<StepGuide>/g) ?? []).length
      const previews = (source.match(/<YamlPreview/g) ?? []).length
      const callouts = (source.match(/:::(tip|note|warning|caution)/g) ?? []).length

      expect(steps, `${file} should include at least 1 StepGuide`).toBeGreaterThanOrEqual(1)
      expect(details, `${file} should include at least 3 Details`).toBeGreaterThanOrEqual(3)
      expect(callouts, `${file} should include at least 2 callouts`).toBeGreaterThanOrEqual(2)

      if (file !== 'installation.mdx') {
        expect(previews, `${file} should include at least 1 YamlPreview`).toBeGreaterThanOrEqual(1)
      }
    }
  })
})
