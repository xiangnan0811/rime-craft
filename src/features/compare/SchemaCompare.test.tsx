import { describe, it, expect, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import { SchemaCompare } from './SchemaCompare'
import type { SchemaCompareData } from '@/data/schema-compare-data'

// Mock the config store
vi.mock('@/stores/config-store', () => ({
  useConfigStore: vi.fn((selector: (s: Record<string, unknown>) => unknown) =>
    selector({
      loadProject: vi.fn(),
    }),
  ),
}))

function createMockSchema(overrides?: Partial<SchemaCompareData>): SchemaCompareData {
  return {
    id: 'test_schema',
    name: '测试方案',
    author: '测试作者',
    inputMethod: '全拼',
    dictSize: '大',
    smartLevel: '高',
    auxiliaryCode: '无',
    features: ['模糊音', '自动纠错'],
    platforms: ['macOS', 'Windows'],
    difficulty: '简单',
    recommendation: '适合新手',
    ...overrides,
  }
}

function renderWithRouter(schemas: SchemaCompareData[]) {
  return render(
    <MemoryRouter>
      <SchemaCompare schemas={schemas} />
    </MemoryRouter>,
  )
}

describe('<SchemaCompare>', () => {
  it('renders schema names as column headers', () => {
    const schemas = [
      createMockSchema({ id: 'a', name: '方案A' }),
      createMockSchema({ id: 'b', name: '方案B' }),
    ]
    renderWithRouter(schemas)

    expect(screen.getByText('方案A')).toBeInTheDocument()
    expect(screen.getByText('方案B')).toBeInTheDocument()
  })

  it('renders comparison row labels', () => {
    renderWithRouter([createMockSchema()])

    expect(screen.getByText('作者')).toBeInTheDocument()
    expect(screen.getByText('输入方式')).toBeInTheDocument()
    expect(screen.getByText('词库规模')).toBeInTheDocument()
    expect(screen.getByText('智能程度')).toBeInTheDocument()
    expect(screen.getByText('辅助码')).toBeInTheDocument()
    expect(screen.getByText('上手难度')).toBeInTheDocument()
    expect(screen.getByText('推荐人群')).toBeInTheDocument()
  })

  it('labels high-drift community rows as manually maintained reference info', () => {
    renderWithRouter([createMockSchema({ id: 'rime_ice' })])

    expect(screen.getByText('更新活跃度（人工维护）')).toBeInTheDocument()
    expect(screen.getByText('社区规模（人工维护）')).toBeInTheDocument()
    expect(screen.getByText(/社区规模与更新活跃度为人工维护快照信息/)).toBeInTheDocument()
  })

  it('displays schema field values in the table', () => {
    const schema = createMockSchema({
      id: 'rime_ice',
      author: 'Dvel',
      inputMethod: '全拼',
      dictSize: '超大',
    })
    renderWithRouter([schema])

    expect(screen.getByText('Dvel')).toBeInTheDocument()
    expect(screen.getByText('超大')).toBeInTheDocument()
  })

  it('renders array features as individual badges', () => {
    const schema = createMockSchema({
      features: ['模糊音', '自动纠错', 'Emoji'],
    })
    renderWithRouter([schema])

    expect(screen.getByText('模糊音')).toBeInTheDocument()
    expect(screen.getByText('自动纠错')).toBeInTheDocument()
    expect(screen.getByText('Emoji')).toBeInTheDocument()
  })

  it('highlights rows where schemas differ', () => {
    const schemaA = createMockSchema({ id: 'a', name: 'A', smartLevel: '高' })
    const schemaB = createMockSchema({ id: 'b', name: 'B', smartLevel: '基础' })
    renderWithRouter([schemaA, schemaB])

    // The row with differing values should have bg-yellow-50 class
    const rows = screen.getByText('智能程度').closest('tr')
    expect(rows).toHaveClass('bg-yellow-50')
  })

  it('does not highlight rows where schemas have the same value', () => {
    const schemaA = createMockSchema({ id: 'a', name: 'A', difficulty: '简单' })
    const schemaB = createMockSchema({ id: 'b', name: 'B', difficulty: '简单' })
    renderWithRouter([schemaA, schemaB])

    const rows = screen.getByText('上手难度').closest('tr')
    expect(rows).not.toHaveClass('bg-yellow-50')
  })

  it('uses preset-loading copy instead of installation copy', () => {
    renderWithRouter([createMockSchema({ id: 'wanxiang', name: '万象拼音', presetId: 'wanxiang' })])
    expect(screen.getByRole('button', { name: '载入预设配置' })).toBeInTheDocument()
    expect(screen.queryByRole('button', { name: '使用这个方案' })).not.toBeInTheDocument()
  })

  it('uses config-loading copy when the schema has no preset', () => {
    renderWithRouter([createMockSchema({ id: 'double_pinyin', name: '自然码双拼' })])
    expect(screen.getByRole('button', { name: '载入该方案配置' })).toBeInTheDocument()
    expect(screen.queryByRole('button', { name: '载入预设配置' })).not.toBeInTheDocument()
  })
})
