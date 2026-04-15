import { describe, expect, it } from 'vitest'
import { TooltipSchema } from '../schema'

describe('TooltipSchema', () => {
  it('parses a minimal valid config', () => {
    expect(TooltipSchema.safeParse({ trigger: 'Info', content: 'Helpful text' }).success).toBe(true)
  })

  it('accepts named slot surfaces', () => {
    expect(
      TooltipSchema.safeParse({
        trigger: 'Info',
        content: 'Helpful text',
        slots: {
          content: {
            bg: 'muted',
          },
          arrow: {
            opacity: 0.8,
          },
        },
      }).success,
    ).toBe(true)
  })
})
