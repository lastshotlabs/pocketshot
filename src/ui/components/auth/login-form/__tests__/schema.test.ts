import { describe, it, expect } from 'vitest'
import { LoginFormSchema } from '../schema'

const action = { type: 'api' as const, endpoint: '/auth/login', method: 'POST' as const }

describe('LoginFormSchema', () => {
  it('parses a valid config', () => {
    const result = LoginFormSchema.parse({ onSubmit: action })
    expect(result.onSubmit).toBeDefined()
  })

  it('parses without onSubmit (z.custom is runtime-transparent)', () => {
    // z.custom<Action>() has no runtime validator — TypeScript-only constraint
    expect(LoginFormSchema.safeParse({}).success).toBe(true)
  })

  it('applies defaults', () => {
    const result = LoginFormSchema.parse({ onSubmit: action })
    expect(result.submitLabel).toBe('Sign In')
    expect(result.showSocialButtons).toBe(false)
    expect(result.socialProviders).toEqual([])
  })

  it('accepts forgotPasswordAction', () => {
    const result = LoginFormSchema.parse({
      onSubmit: action,
      forgotPasswordAction: { type: 'navigate', path: '/forgot' },
    })
    expect(result.forgotPasswordAction).toBeDefined()
  })

  it('accepts registerAction', () => {
    const result = LoginFormSchema.parse({
      onSubmit: action,
      registerAction: { type: 'navigate', path: '/register' },
    })
    expect(result.registerAction).toBeDefined()
  })

  it('accepts social providers', () => {
    const result = LoginFormSchema.parse({
      onSubmit: action,
      showSocialButtons: true,
      socialProviders: ['google', 'apple'],
    })
    expect(result.socialProviders).toEqual(['google', 'apple'])
  })

  it('rejects invalid social provider', () => {
    expect(
      LoginFormSchema.safeParse({
        onSubmit: action,
        socialProviders: ['twitter'],
      }).success,
    ).toBe(false)
  })

  it('accepts all valid social providers', () => {
    for (const provider of ['google', 'apple', 'github'] as const) {
      expect(
        LoginFormSchema.safeParse({ onSubmit: action, socialProviders: [provider] }).success,
      ).toBe(true)
    }
  })
})
