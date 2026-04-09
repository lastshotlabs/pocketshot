import { describe, it, expect } from 'vitest'
import { TimelineSchema } from '../schema'

describe('TimelineSchema', () => {
  it('parses a minimal valid config', () => {
    expect(TimelineSchema.safeParse({}).success).toBe(true)
  })

  it('accepts static items array', () => {
    const result = TimelineSchema.parse({
      items: [
        { id: 'e1', title: 'Order placed', timestamp: '2024-01-01' },
        { id: 'e2', title: 'Shipped', description: 'Sent via FedEx' },
      ],
    })
    expect(result.items).toHaveLength(2)
  })

  it('accepts string data spec', () => {
    const result = TimelineSchema.parse({ data: 'GET /api/timeline' })
    expect(result.data).toBe('GET /api/timeline')
  })

  it('accepts from-ref data spec', () => {
    const result = TimelineSchema.parse({ data: { from: 'events' } })
    expect(result.data).toEqual({ from: 'events' })
  })

  it('item requires id and title', () => {
    expect(TimelineSchema.safeParse({ items: [{ title: 'X' }] }).success).toBe(false)
    expect(TimelineSchema.safeParse({ items: [{ id: 'x' }] }).success).toBe(false)
  })

  it('item accepts optional fields', () => {
    const result = TimelineSchema.parse({
      items: [{ id: 'e1', title: 'Event', description: 'Desc', timestamp: '2024-01-01', icon: 'check', color: '#00ff00' }],
    })
    expect(result.items![0].icon).toBe('check')
    expect(result.items![0].color).toBe('#00ff00')
  })
})
