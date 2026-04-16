import { useState } from 'react'
import { GALLERY_ENTRIES } from '@/data/gallery'
import { GalleryCard } from '@/features/gallery/GalleryCard'
import { Badge } from '@/components/ui/badge'

export function GalleryPage() {
  const [activeTag, setActiveTag] = useState<string | null>(null)

  // Collect all unique tags
  const allTags = [...new Set(GALLERY_ENTRIES.flatMap((e) => e.tags))]

  const filtered = activeTag
    ? GALLERY_ENTRIES.filter((e) => e.tags.includes(activeTag))
    : GALLERY_ENTRIES

  return (
    <div className="mx-auto max-w-6xl px-6 py-8">
      <h1 className="mb-2 text-2xl font-bold">配置画廊</h1>
      <p className="mb-6 text-muted-foreground">浏览社区精选配置，一键导入开始使用。</p>

      {/* Tag filter */}
      <div className="mb-6 flex flex-wrap gap-2">
        <button onClick={() => setActiveTag(null)}>
          <Badge variant={activeTag === null ? 'default' : 'secondary'} className="cursor-pointer">
            全部
          </Badge>
        </button>
        {allTags.map((tag) => (
          <button key={tag} onClick={() => setActiveTag(tag)}>
            <Badge
              variant={activeTag === tag ? 'default' : 'secondary'}
              className="cursor-pointer"
            >
              {tag}
            </Badge>
          </button>
        ))}
      </div>

      {/* Gallery grid */}
      <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
        {filtered.map((entry) => (
          <GalleryCard key={entry.id} entry={entry} />
        ))}
      </div>
    </div>
  )
}
