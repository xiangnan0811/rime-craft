import type { LuaScript } from '@/types/config'

/**
 * Skeleton templates for each Lua script type.
 * The {name} placeholder is replaced with the script's fileName (without .lua).
 */
export const LUA_SCRIPT_TEMPLATES: Record<LuaScript['scriptType'], string> = {
  translator: `-- {name}
-- 类型：Translator（翻译器）
-- 作用：将特定输入映射为候选词

local function {name}(input, seg, env)
  -- TODO: 在此实现你的翻译逻辑
  -- 示例：输入 /hello 输出 "Hello, World!"
  if input == "/hello" then
    yield(Candidate("word", seg.start, seg._end, "Hello, World!", "自定义"))
  end
end

return {name}
`,
  filter: `-- {name}
-- 类型：Filter（过滤器）
-- 作用：对已有候选词进行过滤、排序或修改

local function {name}(input, env)
  for cand in input:iter() do
    -- TODO: 在此处理候选词
    yield(cand)
  end
end

return {name}
`,
  processor: `-- {name}
-- 类型：Processor（处理器）
-- 作用：拦截按键事件

local function {name}(key, env)
  -- 返回值：
  --   kNoop     = 0  未处理，继续传递
  --   kAccepted = 1  已处理，拦截
  --   kRejected = 2  拒绝处理
  return 0  -- kNoop
end

return {name}
`,
}

/**
 * Generate a Lua script from a template, replacing {name} with the script identifier.
 * @param scriptType The type of script to generate.
 * @param identifier The Lua identifier (fileName without .lua, must be valid Lua name).
 */
export function renderLuaTemplate(
  scriptType: LuaScript['scriptType'],
  identifier: string,
): string {
  return LUA_SCRIPT_TEMPLATES[scriptType].replaceAll('{name}', identifier)
}
