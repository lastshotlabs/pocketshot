import { beforeEach, describe, expect, it, vi } from 'vitest'
import React from 'react'
import { RichTextViewer } from '../component'
import { renderWithProviders } from '@ui-test/helpers/renderWithProviders'

describe('RichTextViewer', () => {
  beforeEach(() => vi.clearAllMocks())

  it('renders headings and paragraphs', () => {
    const { getByText } = renderWithProviders(
      <RichTextViewer config={{ content: '<h1>Title</h1><p>Hello world</p>' }} />,
    )

    expect(getByText('Title')).toBeTruthy()
    expect(getByText('Hello world')).toBeTruthy()
  })

  it('resolves content from screen context', () => {
    const { getByText } = renderWithProviders(
      <RichTextViewer config={{ content: { from: 'article.body' } }} />,
      { initialValues: { article: { body: '<p>Resolved body</p>' } } },
    )

    expect(getByText('Resolved body')).toBeTruthy()
  })

  it('renders an expand button when maxLines is provided', () => {
    const { getByText } = renderWithProviders(
      <RichTextViewer config={{ content: '<p>Hello</p>', maxLines: 2 }} />,
    )

    expect(getByText('Show more')).toBeTruthy()
  })

  it('applies the wrapper testID', () => {
    const { getByTestId } = renderWithProviders(
      <RichTextViewer config={{ content: '<p>Hello</p>', testID: 'rtv-root' }} />,
    )

    expect(getByTestId('rtv-root')).toBeTruthy()
  })

  it('renders slot surfaces without crashing', () => {
    const { toJSON } = renderWithProviders(
      <RichTextViewer
        config={{
          content: '<h2>Section</h2><p>Body copy</p>',
          slots: {
            heading: { letterSpacing: 'wide' },
            paragraph: { color: 'muted' },
            expandText: { color: 'primary' },
          },
          maxLines: 2,
        }}
      />,
    )

    expect(toJSON()).toBeTruthy()
  })
})
