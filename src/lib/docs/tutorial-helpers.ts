import { TUTORIAL_NAV, type TutorialItem, type TutorialSection } from '@/data/tutorial-nav'

export interface FlatTutorialItem extends TutorialItem {
  sectionTitle: string
}

/** Flatten TUTORIAL_NAV into a single ordered array with section info */
export function flattenNav(): FlatTutorialItem[] {
  return TUTORIAL_NAV.flatMap((section) =>
    section.items.map((item) => ({
      ...item,
      sectionTitle: section.title,
    })),
  )
}

/** Find the section a slug belongs to */
export function findSectionBySlug(slug: string): TutorialSection | undefined {
  return TUTORIAL_NAV.find((section) =>
    section.items.some((item) => item.slug === slug),
  )
}

/** Get previous and next items for a given slug */
export function getPrevNext(slug: string): {
  prev: FlatTutorialItem | null
  next: FlatTutorialItem | null
} {
  const flat = flattenNav()
  const index = flat.findIndex((item) => item.slug === slug)
  if (index === -1) return { prev: null, next: null }
  return {
    prev: index > 0 ? flat[index - 1]! : null,
    next: index < flat.length - 1 ? flat[index + 1]! : null,
  }
}
