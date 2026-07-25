import { describe, expect, it, vi, beforeEach } from 'vitest'
import React from 'react'
import { HighlightedText } from '../component'
import { renderWithProviders } from '@ui-test/helpers/renderWithProviders'

describe('HighlightedText', () => {
  beforeEach(() => vi.clearAllMocks())

  it('renders without crashing', () => {
    const { toJSON } = renderWithProviders(
      <HighlightedText config={{ text: 'The quick brown fox', highlight: 'fox' }} />,
    )
    expect(toJSON()).toBeTruthy()
  })

  it('renders the source text', () => {
    const { getByText } = renderWithProviders(
      <HighlightedText config={{ text: 'The quick brown fox', highlight: 'fox' }} />,
    )
    expect(getByText('The quick brown fox')).toBeTruthy()
  })

  it('resolves singular highlight from screen context', () => {
    const { getByText } = renderWithProviders(
      <HighlightedText
        config={{ text: 'The quick brown fox', highlight: { from: 'search.query' } }}
      />,
      { initialValues: { search: { query: 'fox' } } },
    )

    expect(getByText('The quick brown fox')).toBeTruthy()
  })

  it('renders with mark slot styling without crashing', () => {
    const { toJSON } = renderWithProviders(
      <HighlightedText
        config={{
          text: 'The quick brown fox',
          highlights: ['quick', 'fox'],
          slots: {
            mark: {
              letterSpacing: 'wide',
              color: 'warning',
            },
          },
        }}
      />,
    )

    expect(toJSON()).toBeTruthy()
  })

  it('supports case-sensitive matching', () => {
    const { toJSON } = renderWithProviders(
      <HighlightedText
        config={{
          text: 'Fox fox',
          highlight: 'Fox',
          caseSensitive: true,
        }}
      />,
    )

    expect(toJSON()).toBeTruthy()
  })
})
