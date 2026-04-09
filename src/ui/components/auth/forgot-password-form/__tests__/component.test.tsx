import { describe, it, expect, vi, beforeEach } from 'vitest'
import React from 'react'
import { act } from 'react-test-renderer'
import { ForgotPasswordForm } from '../component'
import { ForgotPasswordFormSchema } from '../schema'
import { renderWithProviders } from '@ui-test/helpers/renderWithProviders'

const submitAction = {
  type: 'api' as const,
  endpoint: '/auth/forgot-password',
  method: 'POST' as const,
}
const backNavigateAction = { type: 'navigate' as const, path: '/login' }

/** Parse through the Zod schema so defaults (submitLabel, etc.) are applied. */
function cfg(overrides: Record<string, unknown> = {}) {
  return ForgotPasswordFormSchema.parse({ onSubmit: submitAction, ...overrides })
}

/** Find all nodes of a given element type in the react-test-renderer JSON tree. */
function findAllByType(node: unknown, type: string): any[] {
  if (!node) return []
  const results: any[] = []
  if ((node as any).type === type) results.push(node)
  for (const child of (node as any).children ?? []) {
    if (typeof child !== 'string') results.push(...findAllByType(child, type))
  }
  return results
}

describe('ForgotPasswordForm', () => {
  beforeEach(() => vi.clearAllMocks())

  it('renders without crashing', () => {
    const { toJSON } = renderWithProviders(<ForgotPasswordForm config={cfg()} />)
    expect(toJSON()).not.toBeNull()
  })

  it('renders the Email field label', () => {
    const { getByText } = renderWithProviders(<ForgotPasswordForm config={cfg()} />)
    expect(getByText('Email')).toBeTruthy()
  })

  it('renders the instructions text', () => {
    const { getByText } = renderWithProviders(<ForgotPasswordForm config={cfg()} />)
    expect(
      getByText("Enter your email address and we'll send you a link to reset your password."),
    ).toBeTruthy()
  })

  it('renders the submit button with default label "Send Reset Email"', () => {
    const { getByText } = renderWithProviders(<ForgotPasswordForm config={cfg()} />)
    expect(getByText('Send Reset Email')).toBeTruthy()
  })

  it('renders the submit button with a custom submitLabel', () => {
    const { getByText } = renderWithProviders(
      <ForgotPasswordForm config={cfg({ submitLabel: 'Reset Password' })} />,
    )
    expect(getByText('Reset Password')).toBeTruthy()
  })

  it('renders the submit button with the correct default testID', () => {
    const { getByTestId } = renderWithProviders(<ForgotPasswordForm config={cfg()} />)
    expect(getByTestId('forgot-password-submit')).toBeTruthy()
  })

  it('renders the email input with the correct default testID', () => {
    const { getByTestId } = renderWithProviders(<ForgotPasswordForm config={cfg()} />)
    expect(getByTestId('forgot-password-email')).toBeTruthy()
  })

  it('applies custom testID prefix to child elements', () => {
    const { getByTestId } = renderWithProviders(
      <ForgotPasswordForm config={cfg({ testID: 'auth-forgot' })} />,
    )
    expect(getByTestId('auth-forgot')).toBeTruthy()
    expect(getByTestId('auth-forgot-email')).toBeTruthy()
    expect(getByTestId('auth-forgot-submit')).toBeTruthy()
  })

  it('does not render back link when backAction is absent', () => {
    const { toJSON } = renderWithProviders(<ForgotPasswordForm config={cfg()} />)
    const json = JSON.stringify(toJSON())
    expect(json).not.toContain('Back to Sign In')
  })

  it('renders "← Back to Sign In" link when backAction is provided', () => {
    const { getByText } = renderWithProviders(
      <ForgotPasswordForm config={cfg({ backAction: backNavigateAction })} />,
    )
    expect(getByText('← Back to Sign In')).toBeTruthy()
  })

  it('renders the back link testID when backAction is provided', () => {
    const { getByTestId } = renderWithProviders(
      <ForgotPasswordForm config={cfg({ backAction: backNavigateAction })} />,
    )
    expect(getByTestId('forgot-password-back')).toBeTruthy()
  })

  it('shows success state with "Check your email" after dispatch resolves', async () => {
    const { getByText, instance } = renderWithProviders(<ForgotPasswordForm config={cfg()} />)

    act(() => {
      const inputs = findAllByType(instance.toJSON(), 'TextInput')
      inputs[0]?.props?.onChangeText?.('user@example.com')
    })

    await act(async () => {
      const submitBtn = getByText('Send Reset Email') as any
      submitBtn?.props?.onPress?.()
    })

    expect(getByText('Check your email')).toBeTruthy()
  })

  it('shows the entered email address in the success message', async () => {
    const { getByText, instance } = renderWithProviders(<ForgotPasswordForm config={cfg()} />)

    act(() => {
      const inputs = findAllByType(instance.toJSON(), 'TextInput')
      inputs[0]?.props?.onChangeText?.('user@example.com')
    })

    await act(async () => {
      const submitBtn = getByText('Send Reset Email') as any
      submitBtn?.props?.onPress?.()
    })

    expect(
      getByText(
        "We've sent a password reset link to user@example.com. Check your inbox and follow the instructions.",
      ),
    ).toBeTruthy()
  })

  it('shows "Back to Sign In" button in success state when backAction is provided', async () => {
    const { getByText, instance } = renderWithProviders(
      <ForgotPasswordForm config={cfg({ backAction: backNavigateAction })} />,
    )

    act(() => {
      const inputs = findAllByType(instance.toJSON(), 'TextInput')
      inputs[0]?.props?.onChangeText?.('user@example.com')
    })

    await act(async () => {
      const submitBtn = getByText('Send Reset Email') as any
      submitBtn?.props?.onPress?.()
    })

    // In the success state the button renders "Back to Sign In" (no arrow prefix)
    expect(getByText('Back to Sign In')).toBeTruthy()
  })
})
