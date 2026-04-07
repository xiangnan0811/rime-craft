import { useState, useEffect } from 'react'

export interface TocHeading {
  id: string
  text: string
  level: number
}

export function useHeadings(slug: string | undefined): TocHeading[] {
  const [headings, setHeadings] = useState<TocHeading[]>([])

  useEffect(() => {
    const timer = setTimeout(() => {
      const container = document.querySelector('[data-docs-content]')
      if (!container) return

      const els = container.querySelectorAll('h2[id], h3[id]')
      const result: TocHeading[] = []
      els.forEach((el) => {
        result.push({
          id: el.id,
          text: el.textContent ?? '',
          level: el.tagName === 'H2' ? 2 : 3,
        })
      })
      setHeadings(result)
    }, 100)

    return () => clearTimeout(timer)
  }, [slug])

  return headings
}
