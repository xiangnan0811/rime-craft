import { useNavigate } from 'react-router-dom'
import { ExternalLink, Code, BookOpen, MessageCircle } from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { useConfigStore } from '@/stores/config-store'
import { PRESETS } from '@/data/presets'
import { createEmptyProject } from '@/lib/config/defaults'
import {
  SCHEMA_TYPE_LABELS,
  SCHEMA_DIFFICULTY_BADGE_CLASSES,
} from '@/lib/schema-display'
import type { SchemaDetail } from '@/types/schema'

export function SchemaHeader({ schema }: { schema: SchemaDetail }) {
  const navigate = useNavigate()
  const loadProject = useConfigStore((s) => s.loadProject)
  const preset = schema.integration.presetId
    ? PRESETS.find((p) => p.id === schema.integration.presetId)
    : undefined

  function handleUseSchema() {
    if (preset) {
      loadProject(preset.createProject())
    } else {
      const project = createEmptyProject()
      project.defaultConfig.schemaList = [{ schema: schema.id }]
      loadProject(project)
    }
    navigate('/editor')
  }

  return (
    <div className="rounded-lg border bg-gradient-to-br from-blue-50 to-sky-50 p-6 dark:from-blue-950/40 dark:to-sky-950/40">
      <div className="flex items-start justify-between">
        <div>
          <div className="flex items-center gap-3">
            <h1 className="text-2xl font-bold">{schema.name}</h1>
            <Badge variant="secondary">{SCHEMA_TYPE_LABELS[schema.type] ?? schema.type}</Badge>
            <Badge className={SCHEMA_DIFFICULTY_BADGE_CLASSES[schema.compare.difficulty]}>{schema.compare.difficulty}</Badge>
          </div>
          <p className="mt-1 text-sm text-muted-foreground">by {schema.author} · {schema.compare.dictSize} 词库</p>
          <p className="mt-2 text-sm text-foreground/90">{schema.description}</p>
        </div>
        <div className="flex shrink-0 gap-2">
          <Button size="sm" onClick={handleUseSchema}>
            {preset ? '载入该方案预设' : '载入该方案配置'}
          </Button>
        </div>
      </div>
      <div className="mt-4 flex flex-wrap gap-4 text-sm">
        {schema.links.official && (
          <a href={schema.links.official} target="_blank" rel="noreferrer" className="flex items-center gap-1 text-blue-600 hover:underline dark:text-blue-400">
            <ExternalLink className="h-3.5 w-3.5" />官方网站
          </a>
        )}
        {schema.links.repository && (
          <a href={schema.links.repository} target="_blank" rel="noreferrer" className="flex items-center gap-1 text-blue-600 hover:underline dark:text-blue-400">
            <Code className="h-3.5 w-3.5" />GitHub 仓库
          </a>
        )}
        {schema.links.documentation && schema.links.documentation !== schema.links.official && (
          <a href={schema.links.documentation} target="_blank" rel="noreferrer" className="flex items-center gap-1 text-blue-600 hover:underline dark:text-blue-400">
            <BookOpen className="h-3.5 w-3.5" />官方文档
          </a>
        )}
        {schema.links.community.map((link) => (
          <a key={link.url} href={link.url} target="_blank" rel="noreferrer" className="flex items-center gap-1 text-blue-600 hover:underline dark:text-blue-400">
            <MessageCircle className="h-3.5 w-3.5" />{link.label}
          </a>
        ))}
      </div>
    </div>
  )
}
