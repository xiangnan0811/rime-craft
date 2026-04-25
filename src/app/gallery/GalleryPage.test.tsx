import { MemoryRouter, Route, Routes, useLocation } from 'react-router-dom'
import userEvent from '@testing-library/user-event'
import { render, screen, waitFor } from '@testing-library/react'
import { beforeEach, describe, expect, it } from 'vitest'
import { GalleryPage } from './GalleryPage'
import { useConfigStore } from '@/stores/config-store'

function GalleryHarness() {
  return <GalleryPage />
}

function LocationDisplay() {
  const location = useLocation()

  return <div data-testid="location-display">{location.pathname}</div>
}

describe('GalleryPage', () => {
  beforeEach(() => {
    useConfigStore.getState().reset()
  })

  it('renders a curated browse shell with heading, description, and filters', () => {
    render(
      <MemoryRouter>
        <GalleryPage />
      </MemoryRouter>,
    )

    expect(screen.getByText('Explore')).toBeInTheDocument()
    expect(screen.getByRole('heading', { name: '配置画廊' })).toBeInTheDocument()
    expect(
      screen.getByText('浏览社区精选配置，用更清晰的筛选与预览方式快速找到合适风格。'),
    ).toBeInTheDocument()
    expect(screen.getByText('全部')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: '全部' }).className).toContain('transition-colors')
  })

  it('filters the gallery by tag and resets back to the full result set', async () => {
    const user = userEvent.setup()

    render(
      <MemoryRouter>
        <GalleryPage />
      </MemoryRouter>,
    )

    expect(screen.getByText('极简全拼')).toBeInTheDocument()
    expect(screen.getByText('小鹤双拼 + Nord')).toBeInTheDocument()

    await user.click(screen.getByRole('button', { name: '五笔' }))

    expect(screen.getByText('五笔极客')).toBeInTheDocument()
    expect(screen.queryByText('极简全拼')).not.toBeInTheDocument()
    expect(screen.queryByText('小鹤双拼 + Nord')).not.toBeInTheDocument()

    await user.click(screen.getByRole('button', { name: '全部' }))

    expect(screen.getByText('极简全拼')).toBeInTheDocument()
    expect(screen.getByText('小鹤双拼 + Nord')).toBeInTheDocument()
  })

  it('loads a selected gallery project into the store and navigates to the editor', async () => {
    const user = userEvent.setup()

    render(
      <MemoryRouter initialEntries={['/gallery']}>
        <LocationDisplay />
        <Routes>
          <Route path="/gallery" element={<GalleryHarness />} />
          <Route path="/editor" element={<div>editor destination</div>} />
        </Routes>
      </MemoryRouter>,
    )

    const useButtons = screen.getAllByRole('button', { name: '使用此配置' })
    expect(useButtons.length).toBeGreaterThan(0)

    const firstUseButton = useButtons[0]

    if (!firstUseButton) {
      throw new Error('Expected at least one gallery use button')
    }

    await user.click(firstUseButton)

    await waitFor(() => {
      expect(screen.getByTestId('location-display')).toHaveTextContent('/editor')
    })

    expect(screen.getByText('editor destination')).toBeInTheDocument()
    expect(useConfigStore.getState().project.defaultConfig.schemaList.length).toBeGreaterThan(0)
  })
})
