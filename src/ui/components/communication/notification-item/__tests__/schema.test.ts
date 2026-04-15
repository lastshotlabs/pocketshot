import { describe, it, expect } from 'vitest'
import { NotificationItemSchema } from '../schema'

describe('NotificationItemSchema', () => {
  it('parses with string title', () => {
    const result = NotificationItemSchema.parse({ title: 'New message' })
    expect(result.title).toBe('New message')
  })

  it('parses with from-ref title', () => {
    const result = NotificationItemSchema.parse({ title: { from: 'notif' } })
    expect(result.title).toEqual({ from: 'notif' })
  })

  it('requires title', () => {
    expect(NotificationItemSchema.safeParse({}).success).toBe(false)
  })

  it('applies defaults', () => {
    const result = NotificationItemSchema.parse({ title: 'X' })
    expect(result.read).toBe(false)
  })

  it('accepts from-ref body', () => {
    const result = NotificationItemSchema.parse({ title: 'X', body: { from: 'notif' } })
    expect(result.body).toEqual({ from: 'notif' })
  })

  it('accepts from-ref read', () => {
    const result = NotificationItemSchema.parse({ title: 'X', read: { from: 'notif' } })
    expect(result.read).toEqual({ from: 'notif' })
  })

  it('accepts boolean read', () => {
    const result = NotificationItemSchema.parse({ title: 'X', read: true })
    expect(result.read).toBe(true)
  })

  it('accepts onPress and onDismiss actions', () => {
    const action = { type: 'navigate' as const, to: '/notifications' }
    const result = NotificationItemSchema.parse({ title: 'X', onPress: action, onDismiss: action })
    expect(result.onPress).toBeDefined()
    expect(result.onDismiss).toBeDefined()
  })
})
