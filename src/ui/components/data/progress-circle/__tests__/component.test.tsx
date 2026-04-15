import { describe, expect, it, vi, beforeEach } from 'vitest'
import React from 'react'
import { ProgressCircle } from '../component'
import { ProgressCircleSchema } from '../schema'
import { renderWithProviders } from '@ui-test/helpers/renderWithProviders'

function cfg(overrides: Record<string, unknown> = {}) {
  return ProgressCircleSchema.parse({
    value: 64,
    ...overrides,
  })
}

describe('ProgressCircle', () => {
  beforeEach(() => vi.clearAllMocks())

  it('renders without crashing', () => {
    const { toJSON } = renderWithProviders(<ProgressCircle config={cfg()} />)
    expect(toJSON()).toBeTruthy()
  })

  it('renders the percentage value by default', () => {
    const { getByText } = renderWithProviders(<ProgressCircle config={cfg()} />)
    expect(getByText('64%')).toBeTruthy()
  })

  it('exposes progressbar accessibility', () => {
    const { getByRole } = renderWithProviders(<ProgressCircle config={cfg({ label: 'Storage' })} />)
    expect(getByRole('progressbar')).toBeTruthy()
  })

  it('accepts shared color overrides without crashing', () => {
    const { toJSON } = renderWithProviders(<ProgressCircle config={cfg({ color: 'success' })} />)
    expect(toJSON()).toBeTruthy()
  })
})
