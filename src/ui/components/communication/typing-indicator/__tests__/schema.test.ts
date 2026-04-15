import { describe, expect, it } from 'vitest'
import { TypingIndicatorSchema } from '../schema'

describe('TypingIndicatorSchema', () => {
  it('parses a minimal valid config', () => {
    expect(TypingIndicatorSchema.safeParse({ isTyping: true }).success).toBe(true)
  })

  it('accepts shared styling fields and named slots', () => {
    expect(
      TypingIndicatorSchema.safeParse({
        isTyping: true,
        color: 'muted',
        fontSize: 'sm',
        slots: {
          dot: {
            opacity: 0.8,
          },
          text: {
            textAlign: 'center',
          },
        },
      }).success,
    ).toBe(true)
  })
})
