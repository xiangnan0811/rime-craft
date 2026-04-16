import { useState, useCallback } from 'react'
import { SCHEMA_COMPARE_DATA } from '@/data/schema-compare-data'
import { SchemaSelector } from '@/features/compare/SchemaSelector'
import { SchemaCompare } from '@/features/compare/SchemaCompare'
import { Separator } from '@/components/ui/separator'

export function ComparePage() {
  const [selected, setSelected] = useState<string[]>([])

  const handleToggle = useCallback((id: string) => {
    setSelected((prev) =>
      prev.includes(id) ? prev.filter((s) => s !== id) : [...prev, id],
    )
  }, [])

  const selectedSchemas = SCHEMA_COMPARE_DATA.filter((s) => selected.includes(s.id))

  return (
    <div className="mx-auto max-w-6xl px-6 py-8">
      <h1 className="mb-2 text-2xl font-bold">方案对比</h1>
      <p className="mb-6 text-muted-foreground">选择多个输入方案，横向对比它们的特点，找到最适合你的方案。</p>

      <SchemaSelector
        schemas={SCHEMA_COMPARE_DATA}
        selected={selected}
        onToggle={handleToggle}
      />

      {selectedSchemas.length >= 2 && (
        <>
          <Separator className="my-6" />
          <SchemaCompare schemas={selectedSchemas} />
        </>
      )}

      {selectedSchemas.length === 1 && (
        <p className="mt-6 text-center text-sm text-muted-foreground">请再选择至少一个方案进行对比</p>
      )}
    </div>
  )
}
