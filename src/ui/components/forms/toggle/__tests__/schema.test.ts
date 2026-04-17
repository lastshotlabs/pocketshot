import { describe, expect, it } from 'vitest'
import { ToggleSchema } from '../schema'

describe('ToggleSchema', () => {
  it('accepts a minimal valid config', () => {
    expect(
      ToggleSchema.parse({
        id: 'feature-toggle',
      }),
    ).toBeDefined()
  })

  it('accepts refs and slot surfaces', () => {
    expect(
      ToggleSchema.parse({
        id: 'feature-toggle',
        label: { from: 'toggle.label' },
        value: { from: 'toggle.value' },
        disabled: { from: 'toggle.disabled' },
        slots: {
          button: {
            paddingY: 'sm',
          },
          label: {
            letterSpacing: 'wide',
          },
        },
      }),
    ).toBeDefined()
  })
})
