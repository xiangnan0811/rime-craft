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
    <div className="mt-3 rounded border border-gray-200 bg-gray-50 p-3 dark:border-slate-700 dark:bg-slate-900">
      <div className="mb-1 text-xs font-medium text-gray-600 dark:text-slate-400">
        自动生成的 YAML patch（保存时合并到 schema）
      </div>
      <pre className="overflow-x-auto text-xs leading-relaxed text-gray-700 dark:text-slate-300">
        <code>{yaml}</code>
      </pre>
    </div>
  )
}
