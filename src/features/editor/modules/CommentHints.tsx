import { useConfigStore } from '@/stores/config-store'
import { Label } from '@/components/ui/label'
import { Input } from '@/components/ui/input'
import { Switch } from '@/components/ui/switch'
import { LearnMoreLink } from '@/components/shared/LearnMoreLink'
import { SettingHelp } from '@/components/shared/SettingHelp'
import {
  DEFAULT_SUPER_COMMENT_CONFIG,
  SUPER_COMMENT_CANDIDATE_LENGTH_MAX,
  SUPER_COMMENT_CANDIDATE_LENGTH_MIN,
} from '@/types/config'

const DEFAULT_TRANSLATOR = {
  enableCompletion: true,
  enableSentence: true,
  enableUserDict: true,
  initialQuality: 1.2,
  coreWordLength: 4,
  maxWordLength: 7,
  maxHomophones: 8,
  maxHomographs: 8,
  spellingHints: 30,
  alwaysShowComments: true,
}

export function CommentHints() {
  const schemaList = useConfigStore((s) => s.project.defaultConfig.schemaList)
  const schemaConfigs = useConfigStore((s) => s.project.schemaConfigs)
  const updateSchemaConfig = useConfigStore((s) => s.updateSchemaConfig)

  const primarySchemaId = schemaList[0]?.schema ?? ''
  const translator = schemaConfigs[primarySchemaId]?.translator
  const luaExtensions = schemaConfigs[primarySchemaId]?.luaExtensions
  const superComment = luaExtensions?.superComment ?? DEFAULT_SUPER_COMMENT_CONFIG

  function updateSuperComment(partial: Partial<typeof DEFAULT_SUPER_COMMENT_CONFIG>) {
    updateSchemaConfig(primarySchemaId, {
      luaExtensions: {
        ...(luaExtensions ?? {}),
        superComment: { ...superComment, ...partial },
      },
    })
  }

  function updateTranslator(partial: Partial<typeof DEFAULT_TRANSLATOR>) {
    updateSchemaConfig(primarySchemaId, {
      translator: { ...(translator ?? DEFAULT_TRANSLATOR), ...partial },
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
        <p className="mt-1 text-sm text-gray-500">统一编辑写入 <code>translator</code> 与 <code>super_comment</code> 的注释显示参数。</p>
      </div>
      <div className="space-y-4">
        <div>
          <div className="flex flex-wrap items-center gap-x-1.5">
            <Label>拼音提示长度</Label>
            <SettingHelp>
              <p><code>translator/spelling_hints</code> 控制在候选词旁显示拼音提示的范围。</p>
              <p><strong>0</strong> 为关闭，<strong>1</strong> 仅单字显示，较大的值会为更多候选词显示拼音提示。</p>
            </SettingHelp>
          </div>
          <Input
            type="number"
            min={0}
            max={100}
            className="mt-1 w-24"
            value={translator?.spellingHints ?? DEFAULT_TRANSLATOR.spellingHints}
            onChange={(e) => updateTranslator({ spellingHints: Number(e.target.value) })}
          />
          <p className="mt-1 text-sm text-gray-500">显示拼音提示的候选词最大长度，0 为关闭。</p>
        </div>

        <div className="flex items-center justify-between">
          <div className="space-y-1">
            <div className="flex flex-wrap items-center gap-x-1.5">
              <Label>始终显示注释</Label>
              <SettingHelp>
                <p><code>translator/always_show_comments</code> 控制是否在没有辅助码筛选时也渲染注释栏。</p>
                <p>关闭后，只在输入辅助码进行筛选时显示注释。</p>
              </SettingHelp>
            </div>
            <p className="text-sm text-gray-500">即使没有辅助码也显示注释信息。</p>
          </div>
          <Switch
            checked={translator?.alwaysShowComments ?? DEFAULT_TRANSLATOR.alwaysShowComments}
            onCheckedChange={(checked) => updateTranslator({ alwaysShowComments: checked })}
          />
        </div>

        <div>
          <div className="flex flex-wrap items-center gap-x-1.5">
            <Label>注释候选长度</Label>
            <SettingHelp>
              <p><code>super_comment/candidate_length</code> 控制最多为几字的候选词追加注释。</p>
            </SettingHelp>
          </div>
          <Input
            type="number"
            min={SUPER_COMMENT_CANDIDATE_LENGTH_MIN}
            max={SUPER_COMMENT_CANDIDATE_LENGTH_MAX}
            className="mt-1 w-24"
            value={superComment.candidateLength}
            onChange={(e) => updateSuperComment({ candidateLength: Number(e.target.value) })}
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
            value={superComment.correctorType}
            onChange={(e) => updateSuperComment({ correctorType: e.target.value })}
          />
          <p className="mt-1 text-sm text-gray-500">可以改成更短的标记，也可以留空。</p>
        </div>
      </div>
    </div>
  )
}
