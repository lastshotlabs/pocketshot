import { describe, expect, it, vi, beforeEach } from 'vitest'
import React from 'react'
import { QrCode } from '../component'
import { QrCodeSchema } from '../schema'
import { renderWithProviders } from '@ui-test/helpers/renderWithProviders'

function cfg(overrides: Record<string, unknown> = {}) {
  return QrCodeSchema.parse({
    id: 'share-code',
    value: 'https://example.com',
    ...overrides,
  })
}

describe('QrCode', () => {
  beforeEach(() => vi.clearAllMocks())

  it('renders without crashing', () => {
    const { toJSON } = renderWithProviders(<QrCode config={cfg()} />)
    expect(toJSON()).toBeTruthy()
  })

  it('applies the shared wrapper testID', () => {
    const { getByTestId } = renderWithProviders(<QrCode config={cfg({ testID: 'qr-main' })} />)

    expect(getByTestId('qr-main')).toBeTruthy()
  })

  it('resolves the value from screen context', () => {
    const { toJSON } = renderWithProviders(
      <QrCode config={cfg({ value: { from: 'links.share' } })} />,
      { initialValues: { links: { share: 'https://example.com/invite' } } },
    )

    expect(toJSON()).toBeTruthy()
  })

  it('accepts shared color and bg surfaces without crashing', () => {
    const { toJSON } = renderWithProviders(
      <QrCode config={cfg({ color: 'primary', bg: 'card' })} />,
    )

    expect(toJSON()).toBeTruthy()
  })

  it('renders slot surfaces without crashing', () => {
    const { toJSON } = renderWithProviders(
      <QrCode
        config={cfg({
          slots: {
            container: { borderRadius: 'xl' },
            caption: { color: 'primary' },
          },
        })}
      />,
    )

    expect(toJSON()).toBeTruthy()
  })
})
