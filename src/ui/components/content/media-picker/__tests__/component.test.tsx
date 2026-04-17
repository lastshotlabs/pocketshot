import { beforeEach, describe, expect, it, vi } from 'vitest'
import React from 'react'
import { MediaPicker } from '../component'
import { renderWithProviders } from '@ui-test/helpers/renderWithProviders'

describe('MediaPicker', () => {
  beforeEach(() => vi.clearAllMocks())

  const onSelect = { type: 'set-value', target: 'media.selected', value: true } as const

  it('renders the picker affordance', () => {
    const { getByText } = renderWithProviders(
      <MediaPicker config={{ id: 'media-picker', onSelect }} />,
    )

    expect(getByText('Select image')).toBeTruthy()
  })

  it('supports multiple media types', () => {
    const { getByText } = renderWithProviders(
      <MediaPicker
        config={{ id: 'media-picker', onSelect, mediaTypes: ['image', 'video', 'document'] }}
      />,
    )

    expect(getByText('Select media')).toBeTruthy()
  })

  it('applies the wrapper testID', () => {
    const { getByTestId } = renderWithProviders(
      <MediaPicker config={{ id: 'media-picker', onSelect, testID: 'media-root' }} />,
    )

    expect(getByTestId('media-root')).toBeTruthy()
  })

  it('shows the selection count', () => {
    const { getByText } = renderWithProviders(
      <MediaPicker config={{ id: 'media-picker', onSelect, maxSelections: 3 }} />,
    )

    expect(getByText('0/3 selected')).toBeTruthy()
  })

  it('renders slot surfaces without crashing', () => {
    const { toJSON } = renderWithProviders(
      <MediaPicker
        config={{
          id: 'media-picker',
          onSelect,
          slots: {
            pickButton: { borderRadius: 'xl' },
            pickLabel: { letterSpacing: 'wide' },
            removeButton: { borderRadius: 'full' },
          },
        }}
      />,
    )

    expect(toJSON()).toBeTruthy()
  })
})
