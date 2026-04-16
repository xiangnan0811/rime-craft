import { Link } from 'react-router-dom'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { CandidatePreview } from '@/components/shared/CandidatePreview'

const FEATURES = [
  { title: '可视化配置', description: '无需手动编辑 YAML，通过表单直观配置 Rime 各项参数' },
  { title: '正式支持 macOS / Windows 导入导出', description: '当前配置生成与平台文件处理以鼠须管、小狼毫为正式支持范围' },
  { title: '教程覆盖更广的 Rime 生态可用平台', description: '安装、同步与方案知识内容继续覆盖 Linux、Android、iOS 等 Rime 生态可用平台信息' },
  { title: '预设方案', description: '提供多种开箱即用的配置组合，快速上手' },
]

export function HomePage() {
  return (
    <div className="mx-auto max-w-4xl px-6 py-16">
      <div className="text-center">
        <h1 className="mb-4 text-4xl font-bold">Rime Craft</h1>
        <p className="mb-6 text-lg text-muted-foreground">Rime 输入法可视化配置编辑器 — 告别手动编辑 YAML</p>
        <div className="mb-12 flex justify-center">
          <CandidatePreview />
        </div>
        <div className="flex justify-center gap-4">
          <Link to="/editor">
            <Button size="lg">开始配置</Button>
          </Link>
          <Link to="/wizard">
            <Button size="lg" variant="outline">新手向导</Button>
          </Link>
        </div>
      </div>
      <div className="mt-20 grid grid-cols-2 gap-6">
        {FEATURES.map((f) => (
          <Card key={f.title} className="p-5">
            <h3 className="mb-2 font-semibold">{f.title}</h3>
            <p className="text-sm text-muted-foreground">{f.description}</p>
          </Card>
        ))}
      </div>
      <div className="mt-12 text-center">
        <Link to="/gallery" className="text-sm text-blue-600 hover:text-blue-800 hover:underline">
          浏览社区配置画廊 →
        </Link>
      </div>
    </div>
  )
}
