import { describe, expect, it } from 'vitest'
import { AlertSchema } from '../schema'

describe('AlertSchema', () => {
  it('parses a minimal valid config', () => {
    expect(AlertSchema.safeParse({ title: 'Heads up' }).success).toBe(true)
  })

  it('accepts shared styling fields and slot surfaces', () => {
    expect(
      AlertSchema.safeParse({
        title: 'Styled alert',
        body: 'Something changed',
        color: 'warning',
        fontSize: 'lg',
        slots: {
          title: {
            fontWeight: 'bold',
          },
          description: {
            textAlign: 'center',
          },
        },
      }).success,
    ).toBe(true)
  })
})
