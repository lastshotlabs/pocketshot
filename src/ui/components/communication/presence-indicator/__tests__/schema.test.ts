import { describe, expect, it } from 'vitest'
import { PresenceIndicatorSchema } from '../schema'

describe('PresenceIndicatorSchema', () => {
  it('parses with string status', () => {
    const result = PresenceIndicatorSchema.parse({ status: 'online' })
    expect(result.status).toBe('online')
  })

  it('parses with from-ref status', () => {
    const result = PresenceIndicatorSchema.parse({ status: { from: 'presence.state' } })
    expect(result.status).toEqual({ from: 'presence.state' })
  })

  it('applies defaults', () => {
    const result = PresenceIndicatorSchema.parse({ status: 'offline' })
    expect(result.size).toBe('md')
    expect(result.showLabel).toBe(false)
    expect(result.bordered).toBe(true)
  })

  it('accepts shared text styling props', () => {
    const result = PresenceIndicatorSchema.parse({
      status: 'online',
      color: 'primary',
      fontSize: 'lg',
      fontWeight: 'bold',
    })

    expect(result.color).toBe('primary')
    expect(result.fontSize).toBe('lg')
    expect(result.fontWeight).toBe('bold')
  })

  it('accepts named slot surfaces', () => {
    expect(
      PresenceIndicatorSchema.safeParse({
        status: 'online',
        slots: {
          label: {
            textAlign: 'center',
          },
        },
      }).success,
    ).toBe(true)
  })
})
