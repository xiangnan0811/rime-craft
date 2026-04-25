import { useNavigate } from 'react-router-dom'
import { useConfigStore } from '@/stores/config-store'
import { CandidatePreview } from '@/components/shared/CandidatePreview'
import { Card } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import type { GalleryEntry } from '@/data/gallery'

interface GalleryCardProps {
  entry: GalleryEntry
}

export function GalleryCard({ entry }: GalleryCardProps) {
  const navigate = useNavigate()
  const loadProject = useConfigStore((s) => s.loadProject)

  function handleUse() {
    loadProject(entry.getProject())
    navigate('/editor')
  }

  const theme = entry.getTheme()

  return (
    <Card className="group flex h-full flex-col overflow-hidden rounded-2xl border border-border/80 bg-card/80 shadow-sm transition-colors hover:border-border hover:bg-card">
      <div className="flex items-center justify-center border-b border-border/60 bg-muted/40 p-5">
        <CandidatePreview
          candidates={['你好', '你', '尼']}
          labels={['1', '2', '3']}
          input="nihao"
          theme={theme}
          className="scale-90"
        />
      </div>

      <div className="flex flex-1 flex-col p-4">
        <h3 className="text-base font-semibold text-foreground">{entry.name}</h3>
        <p className="mt-1 text-sm text-muted-foreground">{entry.author}</p>
        <p className="mt-2 flex-1 text-sm text-foreground/80">{entry.description}</p>

        <div className="mt-3 flex flex-wrap gap-1">
          {entry.tags.map((tag) => (
            <Badge key={tag} variant="secondary" className="text-xs">
              {tag}
            </Badge>
          ))}
        </div>

        <Button onClick={handleUse} size="sm" className="mt-4 w-full">
          使用此配置
        </Button>
      </div>
    </Card>
  )
}
