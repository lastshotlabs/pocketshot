import { describe, it, expect, vi, beforeEach } from 'vitest'
import React from 'react'
import { Toast } from '../component'
import { renderWithProviders } from '@ui-test/helpers/renderWithProviders'
import type { ToastPayload } from '../types'

function makePayload(overrides?: Partial<ToastPayload>): ToastPayload {
  return {
    id: 1,
    message: 'Something happened',
    variant: 'info',
    duration: 3000,
    ...overrides,
  }
}

describe('Toast', () => {
  beforeEach(() => vi.clearAllMocks())

  it('renders without crashing with minimal config', () => {
    const { toJSON } = renderWithProviders(<Toast config={{ position: 'bottom' }} />)
    expect(toJSON()).toBeNull()
  })

  it('returns null when no __toast payload is in context', () => {
    const { toJSON } = renderWithProviders(<Toast config={{}} />)
    expect(toJSON()).toBeNull()
  })

  it('renders the toast when a __toast payload is present in context', () => {
    const payload = makePayload()
    const { toJSON } = renderWithProviders(<Toast config={{ position: 'bottom' }} />, {
      initialValues: { __toast: payload },
    })
    expect(toJSON()).toBeTruthy()
  })

  it('renders the message text when toast is active', () => {
    const payload = makePayload({ message: 'File saved successfully' })
    const { getByText } = renderWithProviders(<Toast config={{ position: 'bottom' }} />, {
      initialValues: { __toast: payload },
    })
    expect(getByText('File saved successfully')).toBeTruthy()
  })

  it('renders the success icon when variant is success', () => {
    const payload = makePayload({ variant: 'success', id: 10 })
    const { getByText } = renderWithProviders(<Toast config={{ position: 'bottom' }} />, {
      initialValues: { __toast: payload },
    })
    expect(getByText('OK')).toBeTruthy()
  })

  it('renders the error icon when variant is error', () => {
    const payload = makePayload({ variant: 'error', id: 11 })
    const { getByText } = renderWithProviders(<Toast config={{ position: 'bottom' }} />, {
      initialValues: { __toast: payload },
    })
    expect(getByText('X')).toBeTruthy()
  })

  it('renders the warning icon when variant is warning', () => {
    const payload = makePayload({ variant: 'warning', id: 12 })
    const { getByText } = renderWithProviders(<Toast config={{ position: 'bottom' }} />, {
      initialValues: { __toast: payload },
    })
    expect(getByText('!')).toBeTruthy()
  })

  it('renders the info icon when variant is info', () => {
    const payload = makePayload({ variant: 'info', id: 13 })
    const { getByText } = renderWithProviders(<Toast config={{ position: 'bottom' }} />, {
      initialValues: { __toast: payload },
    })
    expect(getByText('i')).toBeTruthy()
  })

  it('renders with accessibilityRole alert when active', () => {
    const payload = makePayload({ id: 20 })
    const { getByRole } = renderWithProviders(<Toast config={{ position: 'bottom' }} />, {
      initialValues: { __toast: payload },
    })
    expect(getByRole('alert')).toBeTruthy()
  })

  it('renders slot surfaces without crashing', () => {
    const payload = makePayload({ id: 31 })
    const { toJSON } = renderWithProviders(
      <Toast
        config={{
          id: 'app-toast',
          position: 'top',
          slots: {
            toast: { borderRadius: 'xl' },
            icon: { color: 'warningForeground' },
            message: { letterSpacing: 'wide' },
          },
        }}
      />,
      { initialValues: { __toast: payload } },
    )
    expect(toJSON()).toBeTruthy()
  })
})
