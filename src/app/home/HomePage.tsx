import { Link } from 'react-router-dom'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { CandidatePreview } from '@/components/shared/CandidatePreview'

const FEATURES = [
  { title: '可视化配置', description: '无需手动编辑 YAML，通过表单直观配置 Rime 各项参数' },
  { title: '全平台支持', description: '鼠须管、小狼毫、ibus-rime、同文、仓输入法一站覆盖' },
  { title: '导入导出', description: '上传已有配置快速编辑，一键导出为可用的配置文件包' },
  { title: '预设方案', description: '提供多种开箱即用的配置组合，快速上手' },
]

export function HomePage() {
  return (
    <div className="mx-auto max-w-4xl px-6 py-16">
      <div className="text-center">
        <h1 className="mb-4 text-4xl font-bold">Rime Craft</h1>
        <p className="mb-6 text-lg text-gray-600">Rime 输入法可视化配置编辑器 — 告别手动编辑 YAML</p>
        <div className="mb-12 flex justify-center">
          <CandidatePreview />
        </div>
        <Link to="/editor">
          <Button size="lg">开始配置</Button>
        </Link>
      </div>
      <div className="mt-20 grid grid-cols-2 gap-6">
        {FEATURES.map((f) => (
          <Card key={f.title} className="p-5">
            <h3 className="mb-2 font-semibold">{f.title}</h3>
            <p className="text-sm text-gray-600">{f.description}</p>
          </Card>
        ))}
      </div>
    </div>
  )
}
