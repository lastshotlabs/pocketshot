import { describe, expect, it, vi, beforeEach } from 'vitest'
import React from 'react'
import { RichTextViewer } from '../component'
import { RichTextViewerSchema } from '../schema'
import { renderWithProviders } from '@ui-test/helpers/renderWithProviders'

function cfg(overrides: Record<string, unknown> = {}) {
  return RichTextViewerSchema.parse({
    id: 'viewer',
    content: '<p>Hello <strong>world</strong></p>',
    ...overrides,
  })
}

describe('RichTextViewer', () => {
  beforeEach(() => vi.clearAllMocks())

  it('renders without crashing', () => {
    const { toJSON } = renderWithProviders(<RichTextViewer config={cfg()} />)
    expect(toJSON()).toBeTruthy()
  })

  it('renders parsed rich text content', () => {
    const { getByText } = renderWithProviders(<RichTextViewer config={cfg()} />)
    expect(getByText('Hello world')).toBeTruthy()
  })

  it('resolves content from screen context', () => {
    const { getByText } = renderWithProviders(
      <RichTextViewer config={cfg({ content: { from: 'article.html' } })} />,
      { initialValues: { article: { html: '<h2>Intro</h2><p>Body</p>' } } },
    )

    expect(getByText('Intro')).toBeTruthy()
    expect(getByText('Body')).toBeTruthy()
  })

  it('shows the expand button when truncated', () => {
    const { getByTestId } = renderWithProviders(
      <RichTextViewer config={cfg({ content: '<p>Line 1</p><p>Line 2</p><p>Line 3</p>', maxLines: 1 })} />,
    )

    expect(getByTestId('viewer-expand')).toBeTruthy()
  })
})
