import { describe, it, expect, beforeEach } from 'vitest'
import { render, screen } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import userEvent from '@testing-library/user-event'
import { Dictionary } from './Dictionary'
import { useConfigStore } from '@/stores/config-store'

function renderWithRouter() {
  return render(
    <MemoryRouter>
      <Dictionary />
    </MemoryRouter>,
  )
}

describe('<Dictionary>', () => {
  beforeEach(() => {
    useConfigStore.getState().reset()
  })

  it('renders the section heading and description', () => {
    renderWithRouter()
    expect(screen.getByText('词典管理')).toBeInTheDocument()
    expect(screen.getByText(/管理自定义词组/)).toBeInTheDocument()
  })

  it('renders the add button and empty state message', () => {
    renderWithRouter()
    expect(screen.getByText('添加词条')).toBeInTheDocument()
    expect(screen.getByText(/暂无词条/)).toBeInTheDocument()
  })

  it('renders table headers', () => {
    renderWithRouter()
    expect(screen.getByText('词条')).toBeInTheDocument()
    expect(screen.getByText('编码')).toBeInTheDocument()
    expect(screen.getByText('权重')).toBeInTheDocument()
  })

  it('clicking add button creates a new empty phrase in the store', async () => {
    const user = userEvent.setup()
    renderWithRouter()

    await user.click(screen.getByText('添加词条'))

    const phrases = useConfigStore.getState().project.customPhrases
    expect(phrases).toHaveLength(1)
    expect(phrases[0]).toEqual({ text: '', code: '', weight: 0 })
  })

  it('displays existing phrases from the store', () => {
    useConfigStore.getState().setCustomPhrases([
      { text: '你好', code: 'ni hao', weight: 1 },
      { text: '世界', code: 'shi jie', weight: 2 },
    ])
    renderWithRouter()

    const inputs = screen.getAllByRole('textbox')
    // Each phrase has 2 textbox inputs (text + code); filter does not show by default
    // Plus the search input and the import textarea
    const textInputValues = inputs.map((i) => (i as HTMLInputElement).value)
    expect(textInputValues).toContain('你好')
    expect(textInputValues).toContain('ni hao')
    expect(textInputValues).toContain('世界')
    expect(textInputValues).toContain('shi jie')
  })

  it('clicking delete removes a phrase from the store', async () => {
    const user = userEvent.setup()
    useConfigStore.getState().setCustomPhrases([
      { text: '测试', code: 'ce shi', weight: 1 },
    ])
    renderWithRouter()

    await user.click(screen.getByText('删除'))

    const phrases = useConfigStore.getState().project.customPhrases
    expect(phrases).toHaveLength(0)
  })
})
