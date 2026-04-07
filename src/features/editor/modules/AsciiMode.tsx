import { useState } from 'react'
import { useConfigStore } from '@/stores/config-store'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Switch } from '@/components/ui/switch'
import { Card } from '@/components/ui/card'

const COMMON_APPS: { bundleId: string; name: string }[] = [
  { bundleId: 'com.apple.Terminal', name: 'Terminal' },
  { bundleId: 'com.microsoft.VSCode', name: 'VS Code' },
  { bundleId: 'com.googlecode.iterm2', name: 'iTerm2' },
  { bundleId: 'com.jetbrains.intellij', name: 'IntelliJ IDEA' },
  { bundleId: 'com.sublimetext.4', name: 'Sublime Text' },
]

export function AsciiMode() {
  const appOptions = useConfigStore((s) => s.project.platformConfig.appOptions)
  const targetPlatform = useConfigStore((s) => s.project.targetPlatform)
  const setAppOption = useConfigStore((s) => s.setAppOption)
  const removeAppOption = useConfigStore((s) => s.removeAppOption)
  const [customBundleId, setCustomBundleId] = useState('')

  const configuredApps = Object.entries(appOptions)
  const unconfiguredCommonApps = COMMON_APPS.filter((app) => !(app.bundleId in appOptions))

  function handleAddCustom() {
    if (!customBundleId.trim()) return
    setAppOption(customBundleId.trim(), true)
    setCustomBundleId('')
  }

  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-semibold">中英文切换与应用设置</h3>
        <p className="mt-1 text-sm text-gray-500">
          为特定应用设置默认输入模式。例如终端和代码编辑器通常默认英文模式。
          {targetPlatform === 'macos' && ' (macOS: 使用 Bundle Identifier)'}
          {targetPlatform === 'windows' && ' (Windows: 使用程序文件名)'}
        </p>
      </div>
      {configuredApps.length > 0 && (
        <div className="space-y-2">
          <Label>已配置的应用</Label>
          {configuredApps.map(([bundleId, opt]) => {
            const appInfo = COMMON_APPS.find((a) => a.bundleId === bundleId)
            return (
              <Card key={bundleId} className="flex items-center justify-between p-3">
                <div>
                  <p className="font-medium">{appInfo?.name ?? bundleId}</p>
                  {appInfo && <p className="text-xs text-gray-400">{bundleId}</p>}
                </div>
                <div className="flex items-center gap-3">
                  <div className="flex items-center gap-2">
                    <span className="text-sm text-gray-500">默认英文</span>
                    <Switch checked={opt.asciiMode} onCheckedChange={(checked) => setAppOption(bundleId, checked)} />
                  </div>
                  <Button variant="ghost" size="sm" onClick={() => removeAppOption(bundleId)}>删除</Button>
                </div>
              </Card>
            )
          })}
        </div>
      )}
      {unconfiguredCommonApps.length > 0 && (
        <div>
          <Label>快速添加常用应用</Label>
          <div className="mt-2 flex flex-wrap gap-2">
            {unconfiguredCommonApps.map((app) => (
              <Button key={app.bundleId} variant="outline" size="sm" onClick={() => setAppOption(app.bundleId, true)}>
                + {app.name}
              </Button>
            ))}
          </div>
        </div>
      )}
      <div>
        <Label>手动添加应用</Label>
        <div className="mt-1 flex gap-2">
          <Input value={customBundleId} onChange={(e) => setCustomBundleId(e.target.value)}
            placeholder={targetPlatform === 'macos' ? 'com.example.app' : 'app.exe'}
            className="w-72" onKeyDown={(e) => e.key === 'Enter' && handleAddCustom()} />
          <Button onClick={handleAddCustom} disabled={!customBundleId.trim()}>添加</Button>
        </div>
      </div>
    </div>
  )
}
