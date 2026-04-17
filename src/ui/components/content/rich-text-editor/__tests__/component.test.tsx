import { beforeEach, describe, expect, it, vi } from 'vitest'
import React from 'react'
import { RichTextEditor } from '../component'
import { renderWithProviders } from '@ui-test/helpers/renderWithProviders'

describe('RichTextEditor', () => {
  beforeEach(() => vi.clearAllMocks())

  it('renders the toolbar', () => {
    const { getByTestId } = renderWithProviders(<RichTextEditor config={{ id: 'editor' }} />)

    expect(getByTestId('editor-toolbar-heading')).toBeTruthy()
  })

  it('renders the footer copy', () => {
    const { getByText } = renderWithProviders(<RichTextEditor config={{ id: 'editor' }} />)

    expect(getByText('Markdown supported')).toBeTruthy()
    expect(getByText('0 chars')).toBeTruthy()
  })

  it('respects placeholder text', () => {
    const { toJSON } = renderWithProviders(
      <RichTextEditor config={{ id: 'editor', placeholder: 'Start drafting...' }} />,
    )

    expect(toJSON()).toBeTruthy()
  })

  it('applies the wrapper testID', () => {
    const { getByTestId } = renderWithProviders(
      <RichTextEditor config={{ id: 'editor', testID: 'editor-root' }} />,
    )

    expect(getByTestId('editor-root')).toBeTruthy()
  })

  it('renders slot surfaces without crashing', () => {
    const { toJSON } = renderWithProviders(
      <RichTextEditor
        config={{
          id: 'editor',
          slots: {
            toolbar: { borderRadius: 'xl' },
            input: { borderRadius: 'lg' },
            footerText: { color: 'primary' },
          },
        }}
      />,
    )

    expect(toJSON()).toBeTruthy()
  })
})
