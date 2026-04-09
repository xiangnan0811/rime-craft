import { useState, useMemo } from 'react'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import {
  searchApps,
  getAppsForPlatform,
  getAppIdentifier,
  CATEGORY_LABELS,
  type AppEntry,
} from '@/data/app-database'
import { LocalAppPicker } from './LocalAppPicker'
import { TerminalCommandHelper } from './TerminalCommandHelper'

interface AppSelectorDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  platform: 'macos' | 'windows' | 'linux'
  configuredAppOptions: Record<string, unknown>
  onSelect: (identifier: string) => void
}

type FallbackPanel = 'local' | 'terminal' | 'manual' | null

export function AppSelectorDialog({
  open,
  onOpenChange,
  platform,
  configuredAppOptions,
  onSelect,
}: AppSelectorDialogProps) {
  const [query, setQuery] = useState('')
  const [activePanel, setActivePanel] = useState<FallbackPanel>(null)
  const [manualInput, setManualInput] = useState('')

  const filteredApps = useMemo(() => {
    if (query.trim()) {
      return searchApps(query, platform)
    }
    return getAppsForPlatform(platform)
  }, [query, platform])

  // Group by category
  const grouped = useMemo(() => {
    const groups: Record<string, AppEntry[]> = {}
    for (const app of filteredApps) {
      const cat = app.category
      if (!groups[cat]) groups[cat] = []
      groups[cat]!.push(app)
    }
    return groups
  }, [filteredApps])

  function handleSelectApp(app: AppEntry) {
    const id = getAppIdentifier(app, platform)
    if (id) {
      onSelect(id)
      handleClose()
    }
  }

  function handleFallbackSelect(identifier: string) {
    onSelect(identifier)
    handleClose()
  }

  function handleManualSubmit() {
    const trimmed = manualInput.trim()
    if (trimmed) {
      onSelect(trimmed)
      handleClose()
    }
  }

  function handleClose() {
    setQuery('')
    setActivePanel(null)
    setManualInput('')
    onOpenChange(false)
  }

  function isConfigured(app: AppEntry): boolean {
    const id = getAppIdentifier(app, platform)
    return id ? id in configuredAppOptions : false
  }

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="max-h-[80vh] overflow-y-auto sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>添加应用</DialogTitle>
          <DialogDescription>
            选择需要设置默认输入模式的应用
          </DialogDescription>
        </DialogHeader>

        {/* Search */}
        <Input
          placeholder="搜索应用名称..."
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          autoFocus
        />

        {/* App Grid */}
        <div className="space-y-4">
          {Object.entries(grouped).map(([category, apps]) => (
            <div key={category}>
              <p className="mb-2 text-sm font-medium text-muted-foreground">
                {CATEGORY_LABELS[category as AppEntry['category']] ?? category}
              </p>
              <div className="flex flex-wrap gap-2">
                {apps.map((app) => {
                  const configured = isConfigured(app)
                  return (
                    <Button
                      key={app.id}
                      variant="outline"
                      size="sm"
                      disabled={configured}
                      onClick={() => handleSelectApp(app)}
                      className={configured ? 'opacity-50' : ''}
                      title={getAppIdentifier(app, platform)}
                    >
                      {app.icon && <span className="mr-1">{app.icon}</span>}
                      {app.name}
                    </Button>
                  )
                })}
              </div>
            </div>
          ))}

          {Object.keys(grouped).length === 0 && (
            <p className="py-4 text-center text-sm text-muted-foreground">
              未找到匹配的应用
            </p>
          )}
        </div>

        {/* Fallback section */}
        <div className="border-t pt-4">
          <p className="mb-3 text-sm font-medium">找不到你的应用？</p>
          <div className="flex flex-wrap gap-2">
            <Button
              variant={activePanel === 'local' ? 'default' : 'outline'}
              size="sm"
              onClick={() => setActivePanel(activePanel === 'local' ? null : 'local')}
            >
              从本地选择
            </Button>
            <Button
              variant={activePanel === 'manual' ? 'default' : 'outline'}
              size="sm"
              onClick={() => setActivePanel(activePanel === 'manual' ? null : 'manual')}
            >
              手动输入标识符
            </Button>
            {platform === 'macos' && (
              <Button
                variant={activePanel === 'terminal' ? 'default' : 'outline'}
                size="sm"
                onClick={() => setActivePanel(activePanel === 'terminal' ? null : 'terminal')}
              >
                终端命令获取
              </Button>
            )}
          </div>

          {activePanel === 'local' && (
            <div className="mt-3">
              <LocalAppPicker platform={platform} onSelect={handleFallbackSelect} />
            </div>
          )}

          {activePanel === 'terminal' && platform === 'macos' && (
            <div className="mt-3">
              <TerminalCommandHelper onSelect={handleFallbackSelect} />
            </div>
          )}

          {activePanel === 'manual' && (
            <div className="mt-3 flex items-center gap-2">
              <Input
                value={manualInput}
                onChange={(e) => setManualInput(e.target.value)}
                placeholder={
                  platform === 'macos'
                    ? 'com.example.app'
                    : platform === 'windows'
                      ? 'app.exe'
                      : 'app-wm-class'
                }
                className="flex-1 font-mono text-sm"
                onKeyDown={(e) => e.key === 'Enter' && handleManualSubmit()}
              />
              <Button size="sm" onClick={handleManualSubmit} disabled={!manualInput.trim()}>
                添加
              </Button>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  )
}
