import { useState } from 'react'
import { useConfigStore } from '@/stores/config-store'
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import { Switch } from '@/components/ui/switch'
import { Card } from '@/components/ui/card'
import { LearnMoreLink } from '@/components/shared/LearnMoreLink'
import { SettingHelp } from '@/components/shared/SettingHelp'
import { AppSelectorDialog } from '../components/AppSelectorDialog'
import {
  APP_DATABASE,
  getAppsForPlatform,
  getAppIdentifier,
} from '@/data/app-database'

/** Show up to 5 quick-add buttons for the most common unconfigured apps */
const QUICK_ADD_CATEGORIES = ['terminal', 'editor', 'ide'] as const
const QUICK_ADD_MAX = 5

export function AsciiMode() {
  const appOptions = useConfigStore((s) => s.project.platformConfig.appOptions)
  const targetPlatform = useConfigStore((s) => s.project.targetPlatform)
  const setAppOption = useConfigStore((s) => s.setAppOption)
  const removeAppOption = useConfigStore((s) => s.removeAppOption)
  const [dialogOpen, setDialogOpen] = useState(false)

  const platform = targetPlatform as 'macos' | 'windows' | 'linux'

  const configuredApps = Object.entries(appOptions)

  // Quick-add: filter to common categories, available on this platform, not yet configured
  const quickAddApps = getAppsForPlatform(platform, appOptions)
    .filter((app) => (QUICK_ADD_CATEGORIES as readonly string[]).includes(app.category))
    .slice(0, QUICK_ADD_MAX)

  function findAppName(identifier: string): string | undefined {
    return APP_DATABASE.find((app) =>
      Object.values(app.platforms).includes(identifier),
    )?.name
  }

  const platformHint =
    platform === 'macos'
      ? ' (macOS: 使用 Bundle Identifier)'
      : platform === 'windows'
        ? ' (Windows: 使用程序文件名)'
        : ' (Linux: 使用 WM_CLASS 或进程名)'

  return (
    <div className="space-y-6">
      <div>
        <div className="flex items-center gap-2">
          <h3 className="text-lg font-semibold">中英文切换与应用设置</h3>
          <LearnMoreLink module="ascii-mode" />
        </div>
        <div className="mt-1 flex flex-wrap items-start gap-x-1.5">
          <p className="text-sm text-muted-foreground">
            为特定应用设置默认输入模式。例如终端和代码编辑器通常默认英文模式。
            {platformHint}
          </p>
          <SettingHelp>
            <p>为应用设置默认英文模式后，切换到该应用时 Rime 自动进入英文输入状态。你仍可手动切换回中文（通过修饰键或 Caps Lock）。</p>
            {platform === 'macos' && (
              <p>macOS 使用 Bundle Identifier 标识应用（格式如 com.apple.Terminal），可在「活动监视器」的应用详情中查看。</p>
            )}
            {platform === 'windows' && (
              <p>Windows 使用程序文件名（如 Code.exe）标识应用。</p>
            )}
            {platform === 'linux' && (
              <p>Linux 使用 WM_CLASS 或进程名标识应用，可通过 xprop 命令或 .desktop 文件查看。</p>
            )}
          </SettingHelp>
        </div>
      </div>

      {/* Configured apps */}
      {configuredApps.length > 0 && (
        <div className="space-y-2">
          <Label>已配置的应用</Label>
          {configuredApps.map(([identifier, opt]) => {
            const appName = findAppName(identifier)
            return (
              <Card key={identifier} className="flex items-center justify-between p-3">
                <div>
                  <p className="font-medium">{appName ?? identifier}</p>
                  {appName && <p className="text-xs text-muted-foreground">{identifier}</p>}
                </div>
                <div className="flex items-center gap-3">
                  <div className="flex items-center gap-2">
                    <span className="text-sm text-muted-foreground">默认英文</span>
                    <Switch
                      checked={opt.asciiMode}
                      onCheckedChange={(checked) => setAppOption(identifier, checked)}
                    />
                  </div>
                  <Button variant="ghost" size="sm" onClick={() => removeAppOption(identifier)}>
                    删除
                  </Button>
                </div>
              </Card>
            )
          })}
        </div>
      )}

      {/* Quick-add buttons */}
      {quickAddApps.length > 0 && (
        <div>
          <Label>快速添加常用应用</Label>
          <div className="mt-2 flex flex-wrap gap-2">
            {quickAddApps.map((app) => {
              const id = getAppIdentifier(app, platform)!
              return (
                <Button
                  key={app.id}
                  variant="outline"
                  size="sm"
                  onClick={() => setAppOption(id, true)}
                >
                  + {app.name}
                </Button>
              )
            })}
          </div>
        </div>
      )}

      {/* Add app button → opens Dialog */}
      <div>
        <Button variant="outline" onClick={() => setDialogOpen(true)}>
          + 添加应用
        </Button>
      </div>

      <AppSelectorDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        platform={platform}
        configuredAppOptions={appOptions}
        onSelect={(identifier) => setAppOption(identifier, true)}
      />
    </div>
  )
}
