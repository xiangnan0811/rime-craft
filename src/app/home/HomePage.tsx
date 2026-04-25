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
    <div className="mx-auto flex max-w-6xl flex-col gap-10 px-6 py-12 md:py-16">
      <section className="grid gap-8 lg:grid-cols-[minmax(0,1.1fr)_minmax(320px,0.9fr)] lg:items-center">
        <div className="space-y-6">
          <div className="space-y-3">
            <p className="text-xs font-medium uppercase tracking-[0.12em] text-muted-foreground">Workbench</p>
            <h1 className="text-4xl font-semibold tracking-tight md:text-5xl">Rime Craft</h1>
            <p className="max-w-2xl text-base leading-7 text-muted-foreground md:text-lg">
              Rime 输入法可视化配置编辑器 —— 用更清晰的工作台方式取代手动编辑 YAML。
            </p>
          </div>

          <div className="flex flex-wrap gap-3">
            <Link to="/editor">
              <Button size="lg">开始配置</Button>
            </Link>
            <Link to="/wizard">
              <Button size="lg" variant="outline">新手向导</Button>
            </Link>
            <Link to="/gallery">
              <Button size="lg" variant="ghost">浏览社区配置画廊</Button>
            </Link>
          </div>
        </div>

        <div className="rounded-3xl border border-border bg-card/80 p-6 shadow-sm">
          <CandidatePreview className="w-full" />
        </div>
      </section>

      <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {FEATURES.map((feature) => (
          <Card key={feature.title} className="rounded-2xl border border-border/80 bg-card/80 p-5 shadow-sm">
            <h2 className="mb-2 text-base font-semibold">{feature.title}</h2>
            <p className="text-sm leading-6 text-muted-foreground">{feature.description}</p>
          </Card>
        ))}
      </section>
    </div>
  )
}
