import { Link } from 'react-router-dom'
import { Button } from '@/components/ui/button'

export function HomePage() {
  return (
    <div className="mx-auto max-w-3xl px-6 py-20 text-center">
      <h1 className="mb-4 text-4xl font-bold">Rime Craft</h1>
      <p className="mb-8 text-lg text-gray-600">
        Rime 输入法可视化配置编辑器
      </p>
      <Link to="/editor">
        <Button size="lg">开始配置</Button>
      </Link>
    </div>
  )
}
