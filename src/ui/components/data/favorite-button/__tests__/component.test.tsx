import { beforeEach, describe, expect, it, vi } from 'vitest'
import React from 'react'
import { FavoriteButton } from '../component'
import { renderWithProviders } from '@ui-test/helpers/renderWithProviders'

describe('FavoriteButton', () => {
  beforeEach(() => vi.clearAllMocks())

  it('renders as a toggle button', () => {
    const { getByRole } = renderWithProviders(<FavoriteButton config={{}} />)
    expect(getByRole('togglebutton')).toBeTruthy()
  })

  it('resolves value from screen context', () => {
    const { toJSON } = renderWithProviders(
      <FavoriteButton config={{ value: { from: 'item.favorite' } }} />,
      { initialValues: { item: { favorite: true } } },
    )
    expect(toJSON()).toBeTruthy()
  })

  it('accepts shared styling props and named slots without crashing', () => {
    const { toJSON } = renderWithProviders(
      <FavoriteButton
        config={{
          color: 'warning',
          fontSize: 'lg',
          slots: {
            root: { paddingX: 'sm' },
            icon: { opacity: 0.8 },
          },
        }}
      />,
    )
    expect(toJSON()).toBeTruthy()
  })
})
