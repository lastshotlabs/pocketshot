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

  it('renders label from screen context via from-ref', () => {
    const { getByText } = renderWithProviders(
      <ProgressCircle config={cfg({ label: { from: 'stats.label' } })} />,
      { initialValues: { stats: { label: 'Storage' } } },
    )

    expect(getByText('Storage')).toBeTruthy()
  })

  it('renders with circular slot surfaces without crashing', () => {
    const { getByText, toJSON } = renderWithProviders(
      <ProgressCircle
        config={cfg({
          label: 'Upload',
          slots: {
            value: {
              letterSpacing: 'wide',
            },
            label: {
              textAlign: 'center',
            },
            circularTrack: {
              opacity: 0.5,
            },
            circularFill: {
              opacity: 0.9,
            },
          },
        })}
      />,
    )

    expect(getByText('64%')).toBeTruthy()
    expect(getByText('Upload')).toBeTruthy()
    expect(toJSON()).toBeTruthy()
  })
})
