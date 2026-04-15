import { describe, expect, it } from 'vitest'
import { NotificationBellSchema } from '../schema'

describe('NotificationBellSchema', () => {
  it('parses a count ref', () => {
    expect(
      NotificationBellSchema.safeParse({
        count: { from: 'notifications.unread' },
      }).success,
    ).toBe(true)
  })

  it('accepts shared styling fields and slot surfaces', () => {
    expect(
      NotificationBellSchema.safeParse({
        count: 12,
        color: 'primary',
        fontSize: 'lg',
        slots: {
          button: {
            paddingX: 'sm',
          },
        },
      }).success,
    ).toBe(true)
  })
})
