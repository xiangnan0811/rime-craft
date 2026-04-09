import { ImageOff } from 'lucide-react'

interface SchemaScreenshotsTabProps {
  schemaId: string
  screenshots: string[]
}

export function SchemaScreenshotsTab({ schemaId, screenshots }: SchemaScreenshotsTabProps) {
  if (screenshots.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-12 text-gray-400">
        <ImageOff className="mb-3 h-10 w-10" />
        <p className="text-sm">暂无截图</p>
        <p className="mt-1 text-xs">欢迎通过 PR 为该方案贡献截图</p>
      </div>
    )
  }
  return (
    <div className="grid gap-4 py-4 sm:grid-cols-2">
      {screenshots.map((filename) => (
        <img key={filename} src={`/screenshots/${schemaId}/${filename}`} alt={`${schemaId} screenshot`} className="rounded-lg border" loading="lazy" />
      ))}
    </div>
  )
}
