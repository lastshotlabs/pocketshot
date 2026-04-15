import { describe, expect, it, vi, beforeEach } from 'vitest'
import React from 'react'
import { act } from 'react-test-renderer'
import { RichTextEditor } from '../component'
import { RichTextEditorSchema } from '../schema'
import { renderWithProviders } from '@ui-test/helpers/renderWithProviders'

function findAllByType(node: unknown, type: string): any[] {
  if (!node) return []
  const results: any[] = []
  if ((node as any).type === type) results.push(node)
  for (const child of (node as any).children ?? []) {
    if (typeof child !== 'string') results.push(...findAllByType(child, type))
  }
  return results
}

function cfg(overrides: Record<string, unknown> = {}) {
  return RichTextEditorSchema.parse({
    id: 'notes',
    ...overrides,
  })
}

describe('RichTextEditor', () => {
  beforeEach(() => vi.clearAllMocks())

  it('renders the editor input and toolbar', () => {
    const { getByTestId, getByText } = renderWithProviders(<RichTextEditor config={cfg()} />)

    expect(getByTestId('notes-input')).toBeTruthy()
    expect(getByText('Markdown supported')).toBeTruthy()
  })

  it('renders with widened dimension inputs without crashing', () => {
    const { toJSON } = renderWithProviders(
      <RichTextEditor config={cfg({ minHeight: '50%', maxHeight: 480, borderRadius: 'xl' })} />,
    )

    expect(toJSON()).toBeTruthy()
  })

  it('updates the character count as the value changes', () => {
    const { getByText, instance } = renderWithProviders(
      <RichTextEditor config={cfg({ defaultValue: 'Hi' })} />,
    )

    act(() => {
      const inputs = findAllByType(instance.toJSON(), 'TextInput')
      inputs[0]?.props?.onChangeText?.('Hello world')
    })

    expect(getByText('11 chars')).toBeTruthy()
  })
})
