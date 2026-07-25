import { beforeEach, describe, expect, it, vi } from 'vitest'
import React from 'react'
import { Skeleton } from '../component'
import { renderWithProviders } from '@ui-test/helpers/renderWithProviders'

describe('Skeleton', () => {
  beforeEach(() => vi.clearAllMocks())

  it('renders without crashing with default config', () => {
    const { toJSON } = renderWithProviders(<Skeleton config={{}} />)
    expect(toJSON()).toBeTruthy()
  })

  it('renders text variant by default', () => {
    const { getByRole } = renderWithProviders(<Skeleton config={{}} />)
    expect(getByRole('progressbar')).toBeTruthy()
  })

  it('renders avatar and circular variants without crashing', () => {
    for (const variant of ['avatar', 'circular'] as const) {
      const { toJSON } = renderWithProviders(<Skeleton config={{ variant }} />)
      expect(toJSON()).toBeTruthy()
    }
  })

  it('renders card and list-item variants without crashing', () => {
    for (const variant of ['card', 'list-item'] as const) {
      const { toJSON } = renderWithProviders(<Skeleton config={{ variant }} />)
      expect(toJSON()).toBeTruthy()
    }
  })

  it('renders custom and rectangular variants with explicit sizing', () => {
    for (const variant of ['custom', 'rectangular'] as const) {
      const { toJSON } = renderWithProviders(
        <Skeleton config={{ variant, width: '60%', height: 32, borderRadius: 'full' }} />,
      )
      expect(toJSON()).toBeTruthy()
    }
  })

  it('renders multiple instances when count is provided', () => {
    const { toJSON } = renderWithProviders(<Skeleton config={{ count: 3 }} />)
    expect(toJSON()).toBeTruthy()
  })

  it('renders static skeleton when animated is false', () => {
    const { toJSON } = renderWithProviders(<Skeleton config={{ animated: false }} />)
    expect(toJSON()).toBeTruthy()
  })

  it('renders with loading slot surfaces without crashing', () => {
    const { toJSON } = renderWithProviders(
      <Skeleton
        config={{
          variant: 'card',
          slots: {
            shape: {
              opacity: 0.6,
            },
            title: {
              width: '70%',
            },
            body: {
              opacity: 0.4,
            },
          },
        }}
      />,
    )

    expect(toJSON()).toBeTruthy()
  })

  it('applies testID when provided', () => {
    const { getByTestId } = renderWithProviders(
      <Skeleton config={{ testID: 'loading-skeleton' }} />,
    )
    expect(getByTestId('loading-skeleton')).toBeTruthy()
  })
})
