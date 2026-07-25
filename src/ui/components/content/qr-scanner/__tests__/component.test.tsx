import { beforeEach, describe, expect, it, vi } from 'vitest'
import React from 'react'
import { QrScanner } from '../component'
import { renderWithProviders } from '@ui-test/helpers/renderWithProviders'

describe('QrScanner', () => {
  beforeEach(() => vi.clearAllMocks())

  const onScan = { type: 'set-value', target: 'scan.value', value: true } as const

  it('renders the fallback scanner when expo-camera is unavailable', () => {
    const { getByText } = renderWithProviders(<QrScanner config={{ onScan }} />)

    expect(getByText('Camera Not Available')).toBeTruthy()
    expect(getByText('npx expo install expo-camera')).toBeTruthy()
  })

  it('applies the wrapper testID', () => {
    const { getByTestId } = renderWithProviders(
      <QrScanner config={{ onScan, testID: 'qr-main' }} />,
    )

    expect(getByTestId('qr-main')).toBeTruthy()
  })

  it('accepts ref-backed overlay text in the config path', () => {
    const { toJSON } = renderWithProviders(
      <QrScanner
        config={{
          onScan,
          overlayText: { from: 'copy.overlay' },
        }}
      />,
      { initialValues: { copy: { overlay: 'Scan a code' } } },
    )

    expect(toJSON()).toBeTruthy()
  })

  it('renders the manual entry UI', () => {
    const { getByText } = renderWithProviders(<QrScanner config={{ onScan }} />)

    expect(getByText('or enter manually')).toBeTruthy()
    expect(getByText('Submit')).toBeTruthy()
  })

  it('renders slot surfaces without crashing', () => {
    const { toJSON } = renderWithProviders(
      <QrScanner
        config={{
          onScan,
          slots: {
            fallback: { borderRadius: 'xl' },
            title: { letterSpacing: 'wide' },
            submitButton: { borderRadius: 'full' },
          },
        }}
      />,
    )

    expect(toJSON()).toBeTruthy()
  })
})
