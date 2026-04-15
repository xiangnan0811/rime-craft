import { describe, it, expect, beforeEach } from 'vitest'
import { render, screen } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import { SchemaManager } from './SchemaManager'
import { useConfigStore } from '@/stores/config-store'

function renderWithRouter() {
  return render(
    <MemoryRouter>
      <SchemaManager />
    </MemoryRouter>,
  )
}

describe('<SchemaManager>', () => {
  beforeEach(() => {
    useConfigStore.getState().reset()
  })

  it('explains that schema manager only writes config references, not upstream schema files', () => {
    renderWithRouter()

    const note = screen.getByText(/管理已启用的输入方案及其优先顺序。列表中排在前面的方案为默认方案。/)
    const text = note.textContent ?? ''

    expect(text).toContain('这里写出的只是 `schema_list` 与相关补丁；')
    expect(text).toContain('目标设备仍需先安装对应的 `.schema.yaml` / `.dict.yaml` 方案文件')
  })
})
