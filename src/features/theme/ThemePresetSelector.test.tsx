import { describe, it, expect, beforeEach } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { ThemePresetSelector } from './ThemePresetSelector'
import { useConfigStore } from '@/stores/config-store'
import { PRESET_THEMES } from '@/data/preset-themes'

describe('<ThemePresetSelector>', () => {
  beforeEach(() => {
    useConfigStore.getState().reset()
  })

  it('renders all preset theme options', () => {
    render(<ThemePresetSelector />)

    for (const preset of PRESET_THEMES) {
      expect(screen.getByText(preset.name)).toBeInTheDocument()
    }
  })

  it('renders the section heading', () => {
    render(<ThemePresetSelector />)
    expect(screen.getByText('预设主题')).toBeInTheDocument()
  })

  it('renders color swatches for each preset', () => {
    render(<ThemePresetSelector />)
    // Each preset renders 3 color swatch divs inside a button, plus the name text
    const buttons = screen.getAllByRole('button')
    expect(buttons.length).toBe(PRESET_THEMES.length)
  })

  it('selecting a preset updates the store theme style', async () => {
    const user = userEvent.setup()
    render(<ThemePresetSelector />)

    const targetPreset = PRESET_THEMES[1]! // macOS Native
    await user.click(screen.getByText(targetPreset.name))

    const storeStyle = useConfigStore.getState().project.platformConfig.style
    expect(storeStyle).toBeDefined()
    expect(storeStyle!.name).toBe(targetPreset.name)
    expect(storeStyle!.colors.backgroundColor).toBe(targetPreset.colors.backgroundColor)
  })

  it('clicking a different preset changes the store to that preset', async () => {
    const user = userEvent.setup()
    render(<ThemePresetSelector />)

    // Click first preset
    await user.click(screen.getByText(PRESET_THEMES[0]!.name))
    expect(useConfigStore.getState().project.platformConfig.style?.name).toBe(PRESET_THEMES[0]!.name)

    // Click a different preset
    const other = PRESET_THEMES[4]! // Nord
    await user.click(screen.getByText(other.name))
    expect(useConfigStore.getState().project.platformConfig.style?.name).toBe(other.name)
  })
})
