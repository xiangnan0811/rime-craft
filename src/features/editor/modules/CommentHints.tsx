import { useConfigStore } from '@/stores/config-store'
import { Label } from '@/components/ui/label'
import { Input } from '@/components/ui/input'
import { LearnMoreLink } from '@/components/shared/LearnMoreLink'
import { SettingHelp } from '@/components/shared/SettingHelp'

const DEFAULT_SUPER_COMMENT = {
  candidateLength: 2,
  correctorType: '〔纠错〕',
}

export function CommentHints() {
  const schemaList = useConfigStore((s) => s.project.defaultConfig.schemaList)
  const schemaConfigs = useConfigStore((s) => s.project.schemaConfigs)
  const updateSchemaConfig = useConfigStore((s) => s.updateSchemaConfig)

  const primarySchemaId = schemaList[0]?.schema ?? ''
  const luaExtensions = schemaConfigs[primarySchemaId]?.luaExtensions
  const config = luaExtensions?.superComment ?? DEFAULT_SUPER_COMMENT

  function update(partial: Partial<typeof DEFAULT_SUPER_COMMENT>) {
    updateSchemaConfig(primarySchemaId, {
      luaExtensions: {
        ...(luaExtensions ?? {}),
        superComment: { ...config, ...partial },
      },
    })
  }

  if (!primarySchemaId) {
    return <div className="text-gray-500">请先在「输入方案管理」中添加至少一个方案。</div>
  }

  return (
    <div className="space-y-6">
      <div>
        <div className="flex items-center gap-2">
          <h3 className="text-lg font-semibold">注释与提示</h3>
          <LearnMoreLink module="comment-hints" />
        </div>
        <p className="mt-1 text-sm text-gray-500">编辑实际写入 <code>super_comment</code> 的注释参数。</p>
      </div>
      <div className="space-y-4">
        <div>
          <div className="flex flex-wrap items-center gap-x-1.5">
            <Label>注释候选长度</Label>
            <SettingHelp>
              <p><code>super_comment/candidate_length</code> 控制最多为几字的候选词追加注释。</p>
            </SettingHelp>
          </div>
          <Input
            type="number"
            min={1}
            max={50}
            className="mt-1 w-24"
            value={config.candidateLength}
            onChange={(e) => update({ candidateLength: Number(e.target.value) })}
          />
          <p className="mt-1 text-sm text-gray-500">设为 1 仅单字显示注释，设为 2 则双字词也显示。</p>
        </div>

        <div>
          <div className="flex flex-wrap items-center gap-x-1.5">
            <Label>纠错提示格式</Label>
            <SettingHelp>
              <p><code>super_comment/corrector_type</code> 是纠错候选注释前的提示文本，例如默认的 <code>〔纠错〕</code>。</p>
            </SettingHelp>
          </div>
          <Input
            className="mt-1 w-48"
            value={config.correctorType}
            onChange={(e) => update({ correctorType: e.target.value })}
          />
          <p className="mt-1 text-sm text-gray-500">可以改成更短的标记，也可以留空。</p>
        </div>
      </div>
    </div>
  )
}
