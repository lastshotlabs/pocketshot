import { describe, expect, it } from 'vitest'
import React from 'react'
import { TagSelector } from '../component'
import { renderWithProviders } from '@ui-test/helpers/renderWithProviders'

const TAGS = [
  { id: 'photo', label: 'Photography' },
  { id: 'travel', label: 'Travel' },
]

describe('TagSelector', () => {
  it('renders without crashing with minimal config', () => {
    const { toJSON } = renderWithProviders(<TagSelector config={{ id: 'tags', availableTags: TAGS }} />)
    expect(toJSON()).toBeTruthy()
  })

  it('renders available tags', () => {
    const result = renderWithProviders(<TagSelector config={{ id: 'tags', availableTags: TAGS }} />)
    expect(result.getByTestId('tags-tag-photo')).toBeTruthy()
    expect(result.getByTestId('tags-tag-travel')).toBeTruthy()
  })

  it('renders slot surfaces without crashing', () => {
    const { toJSON } = renderWithProviders(
      <TagSelector
        config={{
          id: 'tags',
          availableTags: TAGS,
          slots: {
            tagsRow: { gap: 'lg' },
            tag: { borderRadius: 'full' },
            tagText: { color: 'primary' },
          },
        }}
      />,
    )
    expect(toJSON()).toBeTruthy()
  })
})
