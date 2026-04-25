import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import { YamlPreview } from './YamlPreview'

describe('<YamlPreview>', () => {
  it('renders title when provided', () => {
    render(
      <YamlPreview title="example.yaml">
        <pre><code>foo: bar</code></pre>
      </YamlPreview>
    )
    expect(screen.getByText('example.yaml')).toBeInTheDocument()
  })

  it('renders caption when provided', () => {
    render(
      <YamlPreview caption="第 1 行是关键">
        <pre><code>key: value</code></pre>
      </YamlPreview>
    )
    expect(screen.getByText('第 1 行是关键')).toBeInTheDocument()
  })

  it('renders children code block', () => {
    render(
      <YamlPreview>
        <pre><code>schema: test</code></pre>
      </YamlPreview>
    )
    expect(screen.getByText(/schema: test/)).toBeInTheDocument()
  })

  it('exposes highlight lines via data attribute', () => {
    const { container } = render(
      <YamlPreview highlight={[1, 3]}>
        <pre><code>a: 1{'\n'}b: 2{'\n'}c: 3</code></pre>
      </YamlPreview>
    )
    const el = container.querySelector('[data-highlight-lines]')
    expect(el).not.toBeNull()
    expect(el?.getAttribute('data-highlight-lines')).toBe('1,3')
  })

  it('forces embedded pre blocks to stay transparent so syntax theme drives contrast', () => {
    const { container } = render(
      <YamlPreview>
        <pre><code>schema: luna_pinyin</code></pre>
      </YamlPreview>
    )

    const wrapper = Array.from(container.querySelectorAll('div')).find((element) =>
      element.className.includes('[&_pre]:bg-transparent'),
    )
    expect(wrapper).not.toBeNull()
  })
})
