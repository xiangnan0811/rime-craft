import type { LuaScript } from '@/types/config'

interface LuaScriptYamlPreviewProps {
  script: LuaScript
}

export function LuaScriptYamlPreview({ script }: LuaScriptYamlPreviewProps) {
  const identifier = script.fileName.replace(/\.lua$/, '')
  const componentKey = script.scriptType === 'translator'
    ? 'translators'
    : script.scriptType === 'filter'
      ? 'filters'
      : 'processors'
  const modulePrefix = script.scriptType === 'translator'
    ? 'lua_translator'
    : script.scriptType === 'filter'
      ? 'lua_filter'
      : 'lua_processor'

  const yaml = `patch:
  engine/${componentKey}/+:
    - ${modulePrefix}@${identifier}`

  return (
    <div className="mt-3 rounded-xl border border-border bg-card/80 p-3 shadow-sm">
      <div className="mb-1 text-xs font-medium text-muted-foreground">
        自动生成的 YAML patch（保存时合并到 schema）
      </div>
      <pre className="overflow-x-auto rounded-lg bg-muted/40 p-3 text-xs leading-relaxed text-foreground/90">
        <code>{yaml}</code>
      </pre>
    </div>
  )
}
