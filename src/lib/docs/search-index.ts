import MiniSearch from 'minisearch'
import { TUTORIAL_NAV } from '@/data/tutorial-nav'

export interface SearchDoc {
  id: string
  title: string
  section: string
  slug: string
}

let searchInstance: MiniSearch<SearchDoc> | null = null

export function getSearchIndex(): MiniSearch<SearchDoc> {
  if (searchInstance) return searchInstance

  searchInstance = new MiniSearch<SearchDoc>({
    fields: ['title', 'section'],
    storeFields: ['title', 'section', 'slug'],
    searchOptions: {
      boost: { title: 2 },
      fuzzy: 0.2,
      prefix: true,
    },
  })

  const docs: SearchDoc[] = TUTORIAL_NAV.flatMap((section) =>
    section.items.map((item) => ({
      id: item.slug,
      title: item.title,
      section: section.title,
      slug: item.slug,
    })),
  )

  searchInstance.addAll(docs)
  return searchInstance
}

export function searchDocs(query: string): SearchDoc[] {
  if (!query.trim()) return []
  const index = getSearchIndex()
  return index.search(query) as unknown as SearchDoc[]
}
