import { describe, it, expect, vi, beforeEach } from 'vitest'
import React from 'react'
import { LoginForm } from '../component'
import { LoginFormSchema } from '../schema'
import { renderWithProviders } from '@ui-test/helpers/renderWithProviders'

const submitAction = { type: 'api' as const, endpoint: '/auth/login', method: 'POST' as const }
const navigateAction = { type: 'navigate' as const, to: '/forgot-password' }
const registerNavigateAction = { type: 'navigate' as const, to: '/register' }

/** Parse through the Zod schema so defaults (submitLabel, socialProviders, etc.) are applied. */
function cfg(overrides: Record<string, unknown> = {}) {
  return LoginFormSchema.parse({ onSubmit: submitAction, ...overrides })
}

describe('LoginForm', () => {
  beforeEach(() => vi.clearAllMocks())

  it('renders without crashing', () => {
    const { toJSON } = renderWithProviders(<LoginForm config={cfg()} />)
    expect(toJSON()).not.toBeNull()
  })

  it('renders the Email field label', () => {
    const { getByText } = renderWithProviders(<LoginForm config={cfg()} />)
    expect(getByText('Email')).toBeTruthy()
  })

  it('renders the Password field label', () => {
    const { getByText } = renderWithProviders(<LoginForm config={cfg()} />)
    expect(getByText('Password')).toBeTruthy()
  })

  it('renders the submit button with default label "Sign In"', () => {
    const { getByText } = renderWithProviders(<LoginForm config={cfg()} />)
    expect(getByText('Sign In')).toBeTruthy()
  })

  it('renders the submit button with a custom submitLabel', () => {
    const { getByText } = renderWithProviders(<LoginForm config={cfg({ submitLabel: 'Log In' })} />)
    expect(getByText('Log In')).toBeTruthy()
  })

  it('renders the submit button with the correct testID', () => {
    const { getByTestId } = renderWithProviders(<LoginForm config={cfg()} />)
    expect(getByTestId('login-submit')).toBeTruthy()
  })

  it('applies custom testID prefix to child elements', () => {
    const { getByTestId } = renderWithProviders(
      <LoginForm config={cfg({ testID: 'auth-login' })} />,
    )
    expect(getByTestId('auth-login')).toBeTruthy()
    expect(getByTestId('auth-login-email')).toBeTruthy()
    expect(getByTestId('auth-login-password')).toBeTruthy()
    expect(getByTestId('auth-login-submit')).toBeTruthy()
  })

  it('does not render "Forgot password?" link when forgotPasswordAction is absent', () => {
    const { toJSON } = renderWithProviders(<LoginForm config={cfg()} />)
    const json = JSON.stringify(toJSON())
    expect(json).not.toContain('Forgot password?')
  })

  it('renders "Forgot password?" link when forgotPasswordAction is provided', () => {
    const { getByText } = renderWithProviders(
      <LoginForm config={cfg({ forgotPasswordAction: navigateAction })} />,
    )
    expect(getByText('Forgot password?')).toBeTruthy()
  })

  it('renders the forgot link testID when forgotPasswordAction is provided', () => {
    const { getByTestId } = renderWithProviders(
      <LoginForm config={cfg({ forgotPasswordAction: navigateAction })} />,
    )
    expect(getByTestId('login-forgot')).toBeTruthy()
  })

  it('does not render register link when registerAction is absent', () => {
    const { toJSON } = renderWithProviders(<LoginForm config={cfg()} />)
    const json = JSON.stringify(toJSON())
    expect(json).not.toContain('Sign up')
  })

  it('renders "Sign up" link when registerAction is provided', () => {
    const { getByText } = renderWithProviders(
      <LoginForm config={cfg({ registerAction: registerNavigateAction })} />,
    )
    expect(getByText('Sign up')).toBeTruthy()
  })

  it('does not render social buttons when showSocialButtons is false', () => {
    const { toJSON } = renderWithProviders(
      <LoginForm config={cfg({ showSocialButtons: false, socialProviders: ['google'] })} />,
    )
    const json = JSON.stringify(toJSON())
    expect(json).not.toContain('Continue with Google')
  })

  it('renders social buttons when showSocialButtons is true and providers are set', () => {
    const { getByText } = renderWithProviders(
      <LoginForm
        config={cfg({
          showSocialButtons: true,
          socialProviders: ['google', 'apple', 'github'],
        })}
      />,
    )
    expect(getByText('Continue with Google')).toBeTruthy()
    expect(getByText('Continue with Apple')).toBeTruthy()
    expect(getByText('Continue with GitHub')).toBeTruthy()
  })

  it('renders the "or" divider when social buttons are shown', () => {
    const { getByText } = renderWithProviders(
      <LoginForm config={cfg({ showSocialButtons: true, socialProviders: ['google'] })} />,
    )
    expect(getByText('or')).toBeTruthy()
  })
})
