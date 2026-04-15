import { describe, expect, it } from 'vitest'
import { SaveIndicatorSchema } from '../schema'

describe('SaveIndicatorSchema', () => {
  it('parses a status ref', () => {
    expect(
      SaveIndicatorSchema.safeParse({
        status: { from: 'draft.state' },
      }).success,
    ).toBe(true)
  })

  it('accepts shared styling fields and slot surfaces', () => {
    expect(
      SaveIndicatorSchema.safeParse({
        status: 'saving',
        color: 'muted',
        fontSize: 'sm',
        slots: {
          label: {
            letterSpacing: 'wide',
          },
        },
      }).success,
    ).toBe(true)
  })
})
