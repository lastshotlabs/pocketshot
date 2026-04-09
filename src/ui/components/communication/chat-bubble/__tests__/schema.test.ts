import { describe, it, expect } from 'vitest'
import { ChatBubbleSchema } from '../schema'

describe('ChatBubbleSchema', () => {
  it('parses with string message', () => {
    const result = ChatBubbleSchema.parse({ message: 'Hello!' })
    expect(result.message).toBe('Hello!')
  })

  it('parses with from-ref message', () => {
    const result = ChatBubbleSchema.parse({ message: { from: 'msg' } })
    expect(result.message).toEqual({ from: 'msg' })
  })

  it('requires message', () => {
    expect(ChatBubbleSchema.safeParse({}).success).toBe(false)
  })

  it('applies defaults', () => {
    const result = ChatBubbleSchema.parse({ message: 'Hi' })
    expect(result.isOwn).toBe(false)
  })

  it('accepts from-ref isOwn', () => {
    const result = ChatBubbleSchema.parse({ message: 'Hi', isOwn: { from: 'session' } })
    expect(result.isOwn).toEqual({ from: 'session' })
  })

  it('accepts all valid statuses', () => {
    for (const status of ['sending', 'sent', 'read', 'error'] as const) {
      expect(ChatBubbleSchema.safeParse({ message: 'X', status }).success).toBe(true)
    }
  })

  it('rejects invalid status', () => {
    expect(ChatBubbleSchema.safeParse({ message: 'X', status: 'pending' }).success).toBe(false)
  })

  it('accepts avatar with src and name', () => {
    const result = ChatBubbleSchema.parse({
      message: 'Hi',
      avatar: { src: 'https://x.com/a.png', name: 'Alice' },
    })
    expect(result.avatar?.name).toBe('Alice')
  })

  it('accepts from-ref timestamp', () => {
    const result = ChatBubbleSchema.parse({ message: 'Hi', timestamp: { from: 'time' } })
    expect(result.timestamp).toEqual({ from: 'time' })
  })
})
