import { describe, it, expect, vi, beforeEach } from 'vitest'
import React from 'react'
import { act } from 'react-test-renderer'
import { RegisterForm } from '../component'
import { RegisterFormSchema } from '../schema'
import { renderWithProviders } from '@ui-test/helpers/renderWithProviders'

const submitAction = { type: 'api' as const, endpoint: '/auth/register', method: 'POST' as const }
const loginNavigateAction = { type: 'navigate' as const, to: '/login' }

/** Parse through the Zod schema so defaults (submitLabel, fields, etc.) are applied. */
function cfg(overrides: Record<string, unknown> = {}) {
  return RegisterFormSchema.parse({ onSubmit: submitAction, ...overrides })
}

describe('RegisterForm', () => {
  beforeEach(() => vi.clearAllMocks())

  it('renders without crashing', () => {
    const { toJSON } = renderWithProviders(<RegisterForm config={cfg()} />)
    expect(toJSON()).not.toBeNull()
  })

  it('renders the Email field label by default', () => {
    const { getByText } = renderWithProviders(<RegisterForm config={cfg()} />)
    expect(getByText('Email')).toBeTruthy()
  })

  it('renders the Password field label by default', () => {
    const { getByText } = renderWithProviders(<RegisterForm config={cfg()} />)
    expect(getByText('Password')).toBeTruthy()
  })

  it('renders the submit button with default label "Create Account"', () => {
    const { getByText } = renderWithProviders(<RegisterForm config={cfg()} />)
    expect(getByText('Create Account')).toBeTruthy()
  })

  it('renders the submit button with a custom submitLabel', () => {
    const { getByText } = renderWithProviders(
      <RegisterForm config={cfg({ submitLabel: 'Register' })} />,
    )
    expect(getByText('Register')).toBeTruthy()
  })

  it('renders the submit button with the correct default testID', () => {
    const { getByTestId } = renderWithProviders(<RegisterForm config={cfg()} />)
    expect(getByTestId('register-submit')).toBeTruthy()
  })

  it('applies custom testID prefix to child elements', () => {
    const { getByTestId } = renderWithProviders(
      <RegisterForm config={cfg({ testID: 'auth-register' })} />,
    )
    expect(getByTestId('auth-register')).toBeTruthy()
    expect(getByTestId('auth-register-email')).toBeTruthy()
    expect(getByTestId('auth-register-password')).toBeTruthy()
    expect(getByTestId('auth-register-submit')).toBeTruthy()
  })

  it('renders only the fields specified in the fields array', () => {
    const { getByText, toJSON } = renderWithProviders(
      <RegisterForm config={cfg({ fields: ['email', 'username', 'password'] })} />,
    )
    expect(getByText('Email')).toBeTruthy()
    expect(getByText('Username')).toBeTruthy()
    expect(getByText('Password')).toBeTruthy()
    const json = JSON.stringify(toJSON())
    expect(json).not.toContain('Confirm Password')
  })

  it('renders the Username field label when included in fields', () => {
    const { getByText } = renderWithProviders(
      <RegisterForm config={cfg({ fields: ['email', 'username', 'password'] })} />,
    )
    expect(getByText('Username')).toBeTruthy()
  })

  it('renders the Confirm Password field label when included in fields', () => {
    const { getByText } = renderWithProviders(
      <RegisterForm config={cfg({ fields: ['email', 'password', 'confirmPassword'] })} />,
    )
    expect(getByText('Confirm Password')).toBeTruthy()
  })

  it('renders correct testIDs for all four fields', () => {
    const { getByTestId } = renderWithProviders(
      <RegisterForm
        config={cfg({ fields: ['email', 'username', 'password', 'confirmPassword'] })}
      />,
    )
    expect(getByTestId('register-email')).toBeTruthy()
    expect(getByTestId('register-username')).toBeTruthy()
    expect(getByTestId('register-password')).toBeTruthy()
    expect(getByTestId('register-confirmPassword')).toBeTruthy()
  })

  it('does not render login link when loginAction is absent', () => {
    const { toJSON } = renderWithProviders(<RegisterForm config={cfg()} />)
    const json = JSON.stringify(toJSON())
    expect(json).not.toContain('Sign in')
  })

  it('renders "Sign in" link when loginAction is provided', () => {
    const { getByText } = renderWithProviders(
      <RegisterForm config={cfg({ loginAction: loginNavigateAction })} />,
    )
    expect(getByText('Sign in')).toBeTruthy()
  })

  it('renders the login link testID when loginAction is provided', () => {
    const { getByTestId } = renderWithProviders(
      <RegisterForm config={cfg({ loginAction: loginNavigateAction })} />,
    )
    expect(getByTestId('register-login')).toBeTruthy()
  })

  it('shows "Passwords do not match" error after submitting with mismatched passwords', () => {
    const { instance, getByText } = renderWithProviders(
      <RegisterForm config={cfg({ fields: ['password', 'confirmPassword'] })} />,
    )

    function findAllByType(node: ReturnType<typeof instance.toJSON>, type: string): any[] {
      if (!node) return []
      const results: any[] = []
      if ((node as any).type === type) results.push(node)
      for (const child of (node as any).children ?? []) {
        if (typeof child !== 'string') results.push(...findAllByType(child, type))
      }
      return results
    }

    // Set password and confirmPassword to different values via onChangeText
    act(() => {
      const inputs = findAllByType(instance.toJSON(), 'TextInput')
      // fields: ['password', 'confirmPassword'] — index 0 is password, 1 is confirmPassword
      inputs[0]?.props?.onChangeText?.('secret123')
      inputs[1]?.props?.onChangeText?.('different456')
    })

    // Press submit to trigger the mismatch validation
    act(() => {
      const submitBtn = getByText('Create Account') as any
      submitBtn?.props?.onPress?.()
    })

    expect(getByText('Passwords do not match')).toBeTruthy()
  })
})
