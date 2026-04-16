import { useConfigStore } from '@/stores/config-store'
import { SettingHelp } from '@/components/shared/SettingHelp'
import { LuaScriptList } from './LuaScriptList'

export function CustomScriptsTab() {
  const schemaList = useConfigStore((s) => s.project.defaultConfig.schemaList)
  const primarySchemaId = schemaList[0]?.schema ?? ''

  if (!primarySchemaId) {
    return <div className="text-muted-foreground">请先在「输入方案管理」中添加至少一个方案。</div>
  }

  return (
    <div className="space-y-4">
      <div className="flex items-start gap-2 text-sm text-muted-foreground">
        <p>管理你的自定义 Lua 脚本。可以编写 Translator、Filter、Processor 三种类型的脚本。</p>
        <SettingHelp>
          <p>Translator：将特定输入映射为候选词。写完后可在「特殊输入」Tab 关联触发码使用。</p>
          <p>Filter：对已有候选词进行过滤、排序或修改。</p>
          <p>Processor：拦截按键事件，适合实现快捷键或输入流程增强。</p>
          <p>代码编辑器不做语义校验。脚本错误会在 RIME 部署时暴露。</p>
        </SettingHelp>
      </div>
      <LuaScriptList schemaId={primarySchemaId} />
    </div>
  )
}
