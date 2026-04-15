import { describe, expect, it } from 'vitest'

import { contractThemeToTokenConfig, resolveContractTokens } from '../../src/ui/tokens/contract'

describe('pocketshot contract theme bridge', () => {
  it('maps shared theme config into native token config', () => {
    const tokenConfig = contractThemeToTokenConfig({
      flavor: 'slate',
      mode: 'dark',
    })

    expect(tokenConfig).toEqual({
      flavor: 'slate',
      colorScheme: 'dark',
    })
  })

  it('resolves shared theme color overrides into native design tokens', () => {
    const tokens = resolveContractTokens(
      {
        flavor: 'neutral',
        mode: 'light',
        overrides: {
          colors: {
            background: '#f0f4f8',
            card: '#d6e4f0',
            primary: '#1e3a5f',
            border: '#b8cfe0',
            muted: '#d6e4f0',
          },
        },
      },
      'light',
    )

    expect(tokens.colors.background).toBe('#f0f4f8')
    expect(tokens.colors.surface).toBe('#d6e4f0')
    expect(tokens.colors.primary).toBe('#1e3a5f')
    expect(tokens.colors.border).toBe('#b8cfe0')
    expect(tokens.colors.muted).toBe('#d6e4f0')
  })

  it('resolves custom shared flavors by following extends', () => {
    const tokens = resolveContractTokens(
      {
        flavor: 'brand-x',
        flavors: {
          'brand-x': {
            extends: 'slate',
            colors: {
              primary: '#7c3aed',
            },
            spacing: 'comfortable',
          },
        },
      },
      'light',
    )

    expect(tokens.colors.primary).toBe('#7c3aed')
    expect(tokens.spacing[4]).toBeGreaterThan(16)
  })
})
