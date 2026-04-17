import { describe, expect, it } from 'vitest'
import React from 'react'
import { RatingInput } from '../component'
import { renderWithProviders } from '@ui-test/helpers/renderWithProviders'

describe('RatingInput', () => {
  it('renders without crashing with minimal config', () => {
    const { toJSON } = renderWithProviders(<RatingInput config={{ id: 'rating' }} />)
    expect(toJSON()).toBeTruthy()
  })

  it('renders the configured number of stars', () => {
    const result = renderWithProviders(<RatingInput config={{ id: 'rating', maxStars: 4 }} />)
    expect(result.getByTestId('rating-star-0')).toBeTruthy()
    expect(result.getByTestId('rating-star-3')).toBeTruthy()
  })

  it('renders slot surfaces without crashing', () => {
    const { toJSON } = renderWithProviders(
      <RatingInput
        config={{
          id: 'rating',
          slots: {
            starsRow: { gap: 'lg' },
            star: { color: 'warning' },
          },
        }}
      />,
    )
    expect(toJSON()).toBeTruthy()
  })
})
