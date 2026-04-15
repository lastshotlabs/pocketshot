import { describe, expect, it, vi, beforeEach } from 'vitest'
import React from 'react'
import { PresenceIndicator } from '../component'
import { PresenceIndicatorSchema } from '../schema'
import { renderWithProviders } from '@ui-test/helpers/renderWithProviders'

function cfg(overrides: Record<string, unknown> = {}) {
  return PresenceIndicatorSchema.parse({
    id: 'presence',
    status: 'online',
    ...overrides,
  })
}

describe('PresenceIndicator', () => {
  beforeEach(() => vi.clearAllMocks())

  it('renders without crashing', () => {
    const { toJSON } = renderWithProviders(<PresenceIndicator config={cfg()} />)
    expect(toJSON()).toBeTruthy()
  })

  it('renders the label when showLabel is true', () => {
    const { getByText } = renderWithProviders(
      <PresenceIndicator config={cfg({ showLabel: true, label: 'Available' })} />,
    )
    expect(getByText('Available')).toBeTruthy()
  })

  it('resolves status from screen context', () => {
    const { toJSON } = renderWithProviders(
      <PresenceIndicator config={cfg({ status: { from: 'presence.state' }, showLabel: true })} />,
      { initialValues: { presence: { state: 'busy' } } },
    )
    expect(toJSON()).toBeTruthy()
  })

  it('accepts shared text styling props without crashing', () => {
    const { toJSON } = renderWithProviders(
      <PresenceIndicator config={cfg({ showLabel: true, color: 'primary', fontSize: 'lg' })} />,
    )
    expect(toJSON()).toBeTruthy()
  })

  it('accepts slot surfaces without crashing', () => {
    const { toJSON } = renderWithProviders(
      <PresenceIndicator
        config={cfg({
          showLabel: true,
          slots: {
            label: { textAlign: 'center' },
            dot: { opacity: 0.8 },
          },
        })}
      />,
    )
    expect(toJSON()).toBeTruthy()
  })
})
