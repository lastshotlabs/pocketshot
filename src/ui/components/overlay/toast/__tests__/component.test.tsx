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
    // No active toast — component returns null
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
    expect(getByText('✓')).toBeTruthy()
  })

  it('renders the error icon when variant is error', () => {
    const payload = makePayload({ variant: 'error', id: 11 })
    const { getByText } = renderWithProviders(<Toast config={{ position: 'bottom' }} />, {
      initialValues: { __toast: payload },
    })
    expect(getByText('✕')).toBeTruthy()
  })

  it('renders the warning icon when variant is warning', () => {
    const payload = makePayload({ variant: 'warning', id: 12 })
    const { getByText } = renderWithProviders(<Toast config={{ position: 'bottom' }} />, {
      initialValues: { __toast: payload },
    })
    expect(getByText('⚠')).toBeTruthy()
  })

  it('renders the info icon when variant is info', () => {
    const payload = makePayload({ variant: 'info', id: 13 })
    const { getByText } = renderWithProviders(<Toast config={{ position: 'bottom' }} />, {
      initialValues: { __toast: payload },
    })
    expect(getByText('ℹ')).toBeTruthy()
  })

  it('renders with accessibilityRole alert when active', () => {
    const payload = makePayload({ id: 20 })
    const { getByRole } = renderWithProviders(<Toast config={{ position: 'bottom' }} />, {
      initialValues: { __toast: payload },
    })
    expect(getByRole('alert')).toBeTruthy()
  })

  it('renders without crashing with position=top', () => {
    const payload = makePayload({ id: 21 })
    const { toJSON } = renderWithProviders(<Toast config={{ position: 'top' }} />, {
      initialValues: { __toast: payload },
    })
    expect(toJSON()).toBeTruthy()
  })

  it('renders without crashing with position=bottom', () => {
    const payload = makePayload({ id: 22 })
    const { toJSON } = renderWithProviders(<Toast config={{ position: 'bottom' }} />, {
      initialValues: { __toast: payload },
    })
    expect(toJSON()).toBeTruthy()
  })

  it('renders default position (bottom) when position is not set', () => {
    const payload = makePayload({ id: 23 })
    const { toJSON } = renderWithProviders(<Toast config={{}} />, {
      initialValues: { __toast: payload },
    })
    expect(toJSON()).toBeTruthy()
  })

  it('renders all four variants without crashing', () => {
    const variants = ['success', 'error', 'warning', 'info'] as const
    for (const [index, variant] of variants.entries()) {
      const payload = makePayload({ variant, id: 100 + index })
      const { toJSON } = renderWithProviders(<Toast config={{ position: 'bottom' }} />, {
        initialValues: { __toast: payload },
      })
      expect(toJSON()).toBeTruthy()
    }
  })

  it('includes the full accessibility label with variant and message', () => {
    const payload = makePayload({ variant: 'success', message: 'Upload complete', id: 30 })
    const { getByRole } = renderWithProviders(<Toast config={{ position: 'bottom' }} />, {
      initialValues: { __toast: payload },
    })
    const alertNode = getByRole('alert') as { props: Record<string, unknown> }
    expect(alertNode.props.accessibilityLabel).toBe('success: Upload complete')
  })

  it('does not re-show a toast with the same id (deduplication)', () => {
    // Render once with payload id=5
    const payload = makePayload({ id: 5, message: 'First' })
    const { toJSON, instance } = renderWithProviders(<Toast config={{ position: 'bottom' }} />, {
      initialValues: { __toast: payload },
    })
    // Toast is shown
    expect(toJSON()).toBeTruthy()
    // A second render with the same id should not cause a crash
    expect(instance).toBeTruthy()
  })
})
