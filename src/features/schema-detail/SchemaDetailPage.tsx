import { useParams, Link } from 'react-router-dom'
import { getSchemaById } from '@/data/schema-data'
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs'
import { Button } from '@/components/ui/button'
import { SchemaHeader } from './SchemaHeader'
import { SchemaIntroTab } from './SchemaIntroTab'
import { SchemaFeaturesTab } from './SchemaFeaturesTab'
import { SchemaScreenshotsTab } from './SchemaScreenshotsTab'
import { SchemaResourcesTab } from './SchemaResourcesTab'
import { KeyboardLayout } from './KeyboardLayout'

export function SchemaDetailPage() {
  const { id } = useParams<{ id: string }>()
  const schema = id ? getSchemaById(id) : undefined

  if (!schema) {
    return (
      <div className="mx-auto max-w-3xl p-8 text-center">
        <h2 className="mb-4 text-xl font-semibold">找不到该方案</h2>
        <p className="mb-6 text-muted-foreground">请检查方案 ID 是否正确，或返回方案对比页浏览所有方案。</p>
        <Link to="/compare"><Button>浏览所有方案</Button></Link>
      </div>
    )
  }

  const hasKeyboard = schema.visuals.keyboardLayout !== null

  return (
    <div className="mx-auto max-w-4xl px-4 py-6">
      <SchemaHeader schema={schema} />
      <Tabs defaultValue="intro" className="mt-6">
        <TabsList>
          <TabsTrigger value="intro">方案介绍</TabsTrigger>
          <TabsTrigger value="features">功能特性</TabsTrigger>
          <TabsTrigger value="screenshots">截图预览</TabsTrigger>
          <TabsTrigger value="resources">学习资源</TabsTrigger>
          {hasKeyboard && <TabsTrigger value="keyboard">键位图</TabsTrigger>}
        </TabsList>
        <TabsContent value="intro"><SchemaIntroTab schema={schema} /></TabsContent>
        <TabsContent value="features"><SchemaFeaturesTab features={schema.compare.features} /></TabsContent>
        <TabsContent value="screenshots"><SchemaScreenshotsTab schemaId={schema.id} screenshots={schema.visuals.screenshots} /></TabsContent>
        <TabsContent value="resources"><SchemaResourcesTab resources={schema.learningResources} /></TabsContent>
        {hasKeyboard && <TabsContent value="keyboard"><KeyboardLayout data={schema.visuals.keyboardLayout!} /></TabsContent>}
      </Tabs>
      <div className="mt-8 flex items-center justify-between rounded-lg border bg-muted/50 p-4">
        <div>
          <p className="font-medium">想和其他方案对比？</p>
          <p className="text-sm text-muted-foreground">查看方案横向对比，帮你做出更好的选择</p>
        </div>
        <Link to="/compare"><Button variant="outline">前往方案对比</Button></Link>
      </div>
    </div>
  )
}
