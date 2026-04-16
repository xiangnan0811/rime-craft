import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { LearnMoreLink } from '@/components/shared/LearnMoreLink'
import { SpecialInputTab } from './lua/SpecialInputTab'
import { BuiltinEnhancementsTab } from './lua/BuiltinEnhancementsTab'
import { CustomScriptsTab } from './lua/CustomScriptsTab'

export function LuaExtensions() {
  return (
    <div className="space-y-6">
      <div>
        <div className="flex items-center gap-2">
          <h3 className="text-lg font-semibold">Lua 扩展</h3>
          <LearnMoreLink module="lua-extensions" />
        </div>
        <p className="mt-1 text-sm text-muted-foreground">
          管理特殊输入触发器、内置 Lua 功能增强，以及自定义 Lua 脚本。
        </p>
      </div>

      <Tabs defaultValue="special-input" className="w-full">
        <TabsList>
          <TabsTrigger value="special-input">特殊输入</TabsTrigger>
          <TabsTrigger value="builtin">内置功能增强</TabsTrigger>
          <TabsTrigger value="custom-scripts">自定义脚本</TabsTrigger>
        </TabsList>

        <TabsContent value="special-input" className="mt-6">
          <SpecialInputTab />
        </TabsContent>

        <TabsContent value="builtin" className="mt-6">
          <BuiltinEnhancementsTab />
        </TabsContent>

        <TabsContent value="custom-scripts" className="mt-6">
          <CustomScriptsTab />
        </TabsContent>
      </Tabs>
    </div>
  )
}
