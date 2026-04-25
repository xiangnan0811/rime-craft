import { useState } from 'react'
import { GALLERY_ENTRIES } from '@/data/gallery'
import { GalleryCard } from '@/features/gallery/GalleryCard'
import { PageHeader } from '@/components/shared/PageHeader'
import { Badge } from '@/components/ui/badge'

export function GalleryPage() {
  const [activeTag, setActiveTag] = useState<string | null>(null)

  // Collect all unique tags
  const allTags = [...new Set(GALLERY_ENTRIES.flatMap((e) => e.tags))]

  const filtered = activeTag
    ? GALLERY_ENTRIES.filter((e) => e.tags.includes(activeTag))
    : GALLERY_ENTRIES

  return (
    <div className="mx-auto flex max-w-6xl flex-col gap-6 px-6 py-8 md:py-10">
      <PageHeader
        eyebrow="Explore"
        title="配置画廊"
        description="浏览社区精选配置，用更清晰的筛选与预览方式快速找到合适风格。"
      />

      <div className="flex flex-wrap gap-2 rounded-2xl border border-border/80 bg-card/70 p-3 shadow-sm">
        <button
          type="button"
          aria-pressed={activeTag === null}
          onClick={() => setActiveTag(null)}
          className="inline-flex rounded-full transition-colors duration-200 transition-[border-color,background-color,box-shadow] hover:shadow-sm"
        >
          <Badge variant={activeTag === null ? 'default' : 'secondary'} className="cursor-pointer">
            全部
          </Badge>
        </button>
        {allTags.map((tag) => (
          <button
            key={tag}
            type="button"
            aria-pressed={activeTag === tag}
            onClick={() => setActiveTag(tag)}
            className="inline-flex rounded-full transition-colors duration-200 transition-[border-color,background-color,box-shadow] hover:shadow-sm"
          >
            <Badge
              variant={activeTag === tag ? 'default' : 'secondary'}
              className="cursor-pointer"
            >
              {tag}
            </Badge>
          </button>
        ))}
      </div>

      <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
        {filtered.map((entry) => (
          <div key={entry.id} className="rounded-2xl transition-[box-shadow] duration-200 hover:shadow-md">
            <GalleryCard entry={entry} />
          </div>
        ))}
      </div>
    </div>
  )
}
