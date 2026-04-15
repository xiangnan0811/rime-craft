import { describe, it, expect, afterEach } from 'vitest'
import { render, screen, cleanup } from '@testing-library/react'
import { MemoryRouter, Routes, Route } from 'react-router-dom'
import { SchemaDetailPage } from '../SchemaDetailPage'

afterEach(cleanup)

function renderWithRouter(schemaId: string) {
  return render(
    <MemoryRouter initialEntries={[`/schema/${schemaId}`]}>
      <Routes>
        <Route path="/schema/:id" element={<SchemaDetailPage />} />
      </Routes>
    </MemoryRouter>,
  )
}

describe('SchemaDetailPage', () => {
  it('renders schema name for a valid schema', () => {
    renderWithRouter('rime_ice')
    expect(screen.getByText('雾凇拼音')).toBeInTheDocument()
  })

  it('shows not-found message for an invalid schema', () => {
    renderWithRouter('nonexistent_schema')
    expect(screen.getByText(/找不到该方案/)).toBeInTheDocument()
  })

  it('renders tab navigation', () => {
    renderWithRouter('rime_ice')
    expect(screen.getByRole('tab', { name: '方案介绍' })).toBeInTheDocument()
    expect(screen.getByRole('tab', { name: '功能特性' })).toBeInTheDocument()
    expect(screen.getByRole('tab', { name: '学习资源' })).toBeInTheDocument()
  })

  it('renders keyboard layout tab for double-pinyin schemas', () => {
    renderWithRouter('double_pinyin_flypy')
    expect(screen.getByRole('tab', { name: '键位图' })).toBeInTheDocument()
  })

  it('does not render keyboard layout tab for non-double-pinyin schemas', () => {
    renderWithRouter('rime_ice')
    expect(screen.queryByRole('tab', { name: '键位图' })).not.toBeInTheDocument()
  })

  it('shows wanxiang pro as a double-pinyin schema', () => {
    renderWithRouter('wanxiang_pro')
    expect(screen.getByText('双拼')).toBeInTheDocument()
  })

  it('uses preset-loading copy in the schema detail CTA', () => {
    renderWithRouter('rime_ice')
    expect(screen.getByRole('button', { name: '载入该方案预设' })).toBeInTheDocument()
    expect(screen.queryByRole('button', { name: '使用此方案' })).not.toBeInTheDocument()
  })

  it('uses config-loading copy when the schema has no preset', () => {
    renderWithRouter('double_pinyin')
    expect(screen.getByRole('button', { name: '载入该方案配置' })).toBeInTheDocument()
    expect(screen.queryByRole('button', { name: '载入该方案预设' })).not.toBeInTheDocument()
  })

  it('keeps the hero meta line limited to stable facts', () => {
    renderWithRouter('rime_ice')

    const metaLine = screen.getByText('by Dvel · 200万+ 词库')
    expect(metaLine).toBeInTheDocument()
    expect(metaLine).not.toHaveTextContent('每周更新')
    expect(screen.queryByRole('link', { name: /10k\+/ })).not.toBeInTheDocument()
  })

  it('shows a reference-info note for community snapshot fields on the intro tab', () => {
    renderWithRouter('rime_ice')
    expect(screen.getByText(/社区规模与更新频率为人工维护快照信息/)).toBeInTheDocument()
    expect(screen.getByText('更新频率（人工维护）')).toBeInTheDocument()
  })
})
