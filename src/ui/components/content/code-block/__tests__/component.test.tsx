import { describe, expect, it, vi, beforeEach } from 'vitest'
import React from 'react'
import { CodeBlock } from '../component'
import { CodeBlockSchema } from '../schema'
import { renderWithProviders } from '@ui-test/helpers/renderWithProviders'

function cfg(overrides: Record<string, unknown> = {}) {
  return CodeBlockSchema.parse({
    id: 'code',
    code: 'const x = 1',
    ...overrides,
  })
}

describe('CodeBlock', () => {
  beforeEach(() => vi.clearAllMocks())

  it('renders without crashing', () => {
    const { toJSON } = renderWithProviders(<CodeBlock config={cfg()} />)
    expect(toJSON()).toBeTruthy()
  })

  it('renders code content', () => {
    const { getByText } = renderWithProviders(<CodeBlock config={cfg()} />)
    expect(getByText('const x = 1')).toBeTruthy()
  })

  it('resolves code from screen context', () => {
    const { getByText } = renderWithProviders(
      <CodeBlock config={cfg({ code: { from: 'snippet.code' } })} />,
      { initialValues: { snippet: { code: 'console.log(42)' } } },
    )

    expect(getByText('console.log(42)')).toBeTruthy()
  })

  it('accepts shared surface and text props without crashing', () => {
    const { toJSON } = renderWithProviders(
      <CodeBlock config={cfg({ bg: 'card', borderRadius: 'xl', color: 'muted', fontSize: 'lg' })} />,
    )

    expect(toJSON()).toBeTruthy()
  })

  it('renders slot surfaces without crashing', () => {
    const { toJSON } = renderWithProviders(
      <CodeBlock
        config={cfg({
          slots: {
            container: { borderRadius: 'xl' },
            header: { paddingY: 'sm' },
            codeLine: { color: 'primary' },
          },
        })}
      />,
    )

    expect(toJSON()).toBeTruthy()
  })
})
