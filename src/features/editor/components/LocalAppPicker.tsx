import { useRef, useState } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { parseBundleIdFromPlist, getExeFileName, parseDesktopFile } from '@/lib/app-identifier'

interface LocalAppPickerProps {
  platform: 'macos' | 'windows' | 'linux'
  onSelect: (identifier: string) => void
}

const PLATFORM_CONFIG = {
  macos: {
    accept: '.plist',
    label: '选择 Info.plist',
    hint: '在 Finder 中右键 .app → 显示包内容 → 打开 Contents 文件夹 → 选择 Info.plist',
  },
  windows: {
    accept: '.exe',
    label: '选择 .exe 文件',
    hint: '浏览到应用安装目录（通常在 C:\\Program Files），选择 .exe 文件',
  },
  linux: {
    accept: '.desktop',
    label: '选择 .desktop 文件',
    hint: '通常位于 /usr/share/applications 或 ~/.local/share/applications',
  },
} as const

export function LocalAppPicker({ platform, onSelect }: LocalAppPickerProps) {
  const fileInputRef = useRef<HTMLInputElement>(null)
  const [error, setError] = useState<string | null>(null)
  const [parsedId, setParsedId] = useState<string | null>(null)

  const config = PLATFORM_CONFIG[platform]

  async function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return
    setError(null)
    setParsedId(null)

    if (platform === 'windows') {
      const name = getExeFileName(file)
      setParsedId(name)
      return
    }

    try {
      const content = await file.text()

      if (platform === 'macos') {
        const bundleId = parseBundleIdFromPlist(content)
        if (bundleId) {
          setParsedId(bundleId)
        } else {
          setError('未能解析 Bundle ID。文件可能为二进制格式，请使用终端命令获取。')
        }
      } else {
        const id = parseDesktopFile(content)
        if (id) {
          setParsedId(id)
        } else {
          setError('未能解析应用标识符，请手动输入。')
        }
      }
    } catch {
      setError('文件读取失败，请重试。')
    }

    // Reset input so selecting the same file again triggers onChange
    if (fileInputRef.current) fileInputRef.current.value = ''
  }

  function handleConfirm() {
    if (parsedId) {
      onSelect(parsedId)
      setParsedId(null)
    }
  }

  return (
    <div className="space-y-3">
      <p className="text-sm text-muted-foreground">{config.hint}</p>

      <input
        ref={fileInputRef}
        type="file"
        accept={config.accept}
        className="hidden"
        onChange={handleFileChange}
      />
      <Button
        variant="outline"
        size="sm"
        onClick={() => fileInputRef.current?.click()}
      >
        {config.label}
      </Button>

      {error && <p className="text-sm text-destructive">{error}</p>}

      {parsedId && (
        <div className="flex items-center gap-2">
          <Input value={parsedId} readOnly className="flex-1 font-mono text-sm" />
          <Button size="sm" onClick={handleConfirm}>
            添加
          </Button>
        </div>
      )}
    </div>
  )
}
