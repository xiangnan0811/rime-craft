import { describe, it, expect, beforeEach } from 'vitest'
import { render, screen } from '@testing-library/react'
import { ThemeColorSection } from './ThemeColorSection'
import { useConfigStore } from '@/stores/config-store'
import { PRESET_THEMES } from '@/data/preset-themes'

describe('<ThemeColorSection>', () => {
  beforeEach(() => {
    useConfigStore.getState().reset()
  })

  it('renders nothing when no theme style is set', () => {
    // Default store has no style set
    const { container } = render(<ThemeColorSection />)
    expect(container.innerHTML).toBe('')
  })

  it('renders color labels when a theme style is set', () => {
    // Set a theme first
    useConfigStore.getState().setThemeStyle(structuredClone(PRESET_THEMES[0]!))

    render(<ThemeColorSection />)

    expect(screen.getByText('背景色')).toBeInTheDocument()
    expect(screen.getByText('边框色')).toBeInTheDocument()
    expect(screen.getByText('输入文字色')).toBeInTheDocument()
    expect(screen.getByText('高亮拼音色')).toBeInTheDocument()
    expect(screen.getByText('候选文字色')).toBeInTheDocument()
    expect(screen.getByText('选中候选文字')).toBeInTheDocument()
    expect(screen.getByText('选中候选背景')).toBeInTheDocument()
    expect(screen.getByText('注释色')).toBeInTheDocument()
    expect(screen.getByText('标签色')).toBeInTheDocument()
  })

  it('renders the section heading', () => {
    useConfigStore.getState().setThemeStyle(structuredClone(PRESET_THEMES[0]!))
    render(<ThemeColorSection />)
    expect(screen.getByText('颜色')).toBeInTheDocument()
  })

  it('renders all 10 color fields', () => {
    useConfigStore.getState().setThemeStyle(structuredClone(PRESET_THEMES[0]!))
    render(<ThemeColorSection />)

    // The ThemeColorPicker renders a Label for each color field
    const expectedLabels = [
      '背景色', '边框色', '输入文字色', '高亮拼音色', '拼音区背景',
      '候选文字色', '选中候选文字', '选中候选背景', '注释色', '标签色',
    ]
    for (const label of expectedLabels) {
      expect(screen.getByText(label)).toBeInTheDocument()
    }
  })

  it('updateThemeColors updates the store when called directly', () => {
    useConfigStore.getState().setThemeStyle(structuredClone(PRESET_THEMES[0]!))

    // Simulate what the component does when a color changes
    useConfigStore.getState().updateThemeColors({ backgroundColor: '#FF0000' })

    const colors = useConfigStore.getState().project.platformConfig.style?.colors
    expect(colors?.backgroundColor).toBe('#FF0000')
    // Other colors should remain unchanged
    expect(colors?.textColor).toBe(PRESET_THEMES[0]!.colors.textColor)
  })
})
