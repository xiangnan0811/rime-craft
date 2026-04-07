import { useNavigate } from 'react-router-dom'
import { useConfigStore } from '@/stores/config-store'
import { CandidatePreview } from '@/components/shared/CandidatePreview'
import { Card } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import type { GalleryEntry } from '@/data/gallery'

interface GalleryCardProps {
  entry: GalleryEntry;
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
    <Card className="flex flex-col overflow-hidden">
      {/* Theme preview */}
      <div className="flex items-center justify-center bg-gray-100 p-4">
        <CandidatePreview
          candidates={['你好', '你', '尼']}
          labels={['1', '2', '3']}
          input="nihao"
          theme={theme}
          className="scale-90"
        />
      </div>

      {/* Info */}
      <div className="flex flex-1 flex-col p-4">
        <h3 className="font-semibold">{entry.name}</h3>
        <p className="mt-1 text-sm text-gray-500">{entry.author}</p>
        <p className="mt-2 flex-1 text-sm text-gray-600">{entry.description}</p>

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
