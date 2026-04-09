import { describe, it, expect, vi, beforeEach } from 'vitest'
import React from 'react'
import { LoadingState } from '../component'
import { renderWithProviders } from '@ui-test/helpers/renderWithProviders'

describe('LoadingState', () => {
  beforeEach(() => vi.clearAllMocks())

  it('renders without crashing with minimal config', () => {
    const { toJSON } = renderWithProviders(
      <LoadingState config={{ variant: 'skeleton', count: 3, height: 48 }} />,
    )
    expect(toJSON()).toBeTruthy()
  })

  it('renders skeleton variant by default', () => {
    const { getByRole } = renderWithProviders(
      <LoadingState config={{ variant: 'skeleton', count: 3, height: 48 }} />,
    )
    expect(getByRole('progressbar')).toBeTruthy()
  })

  it('renders spinner variant without crashing', () => {
    const { toJSON } = renderWithProviders(
      <LoadingState config={{ variant: 'spinner', count: 3, height: 48 }} />,
    )
    expect(toJSON()).toBeTruthy()
  })

  it('spinner variant has progressbar accessibility role', () => {
    const { getByRole } = renderWithProviders(
      <LoadingState config={{ variant: 'spinner', count: 3, height: 48 }} />,
    )
    expect(getByRole('progressbar')).toBeTruthy()
  })

  it('applies testID when provided', () => {
    const { getByTestId } = renderWithProviders(
      <LoadingState
        config={{ variant: 'skeleton', count: 3, height: 48, testID: 'loading-state-main' }}
      />,
    )
    expect(getByTestId('loading-state-main')).toBeTruthy()
  })

  it('renders without crashing for various count values', () => {
    for (const count of [1, 3, 5, 10]) {
      const { toJSON } = renderWithProviders(
        <LoadingState config={{ variant: 'skeleton', count, height: 48 }} />,
      )
      expect(toJSON()).toBeTruthy()
    }
  })

  it('renders without crashing for various height values', () => {
    for (const height of [24, 48, 80, 120]) {
      const { toJSON } = renderWithProviders(
        <LoadingState config={{ variant: 'skeleton', count: 3, height }} />,
      )
      expect(toJSON()).toBeTruthy()
    }
  })

  it('renders skeleton variant with Loading accessibility label', () => {
    const { toJSON } = renderWithProviders(
      <LoadingState config={{ variant: 'skeleton', count: 3, height: 48 }} />,
    )
    const json = JSON.stringify(toJSON())
    expect(json).toContain('Loading')
  })

  it('renders spinner variant with Loading accessibility label', () => {
    const { toJSON } = renderWithProviders(
      <LoadingState config={{ variant: 'spinner', count: 3, height: 48 }} />,
    )
    const json = JSON.stringify(toJSON())
    expect(json).toContain('Loading')
  })
})
