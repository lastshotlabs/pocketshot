import { describe, it, expect } from 'vitest'
import { HeaderSchema } from '../schema'

const action = { type: 'navigate' as const, path: '/search' }
const headerAction = { icon: 'search', label: 'Search', action }

describe('HeaderSchema', () => {
  it('parses a valid config', () => {
    const result = HeaderSchema.parse({ title: 'Home' })
    expect(result.title).toBe('Home')
  })

  it('requires title', () => {
    expect(HeaderSchema.safeParse({}).success).toBe(false)
  })

  it('applies defaults', () => {
    const result = HeaderSchema.parse({ title: 'Home' })
    expect(result.showBack).toBe(false)
  })

  it('accepts subtitle', () => {
    const result = HeaderSchema.parse({ title: 'Home', subtitle: 'Welcome back' })
    expect(result.subtitle).toBe('Welcome back')
  })

  it('accepts leftAction', () => {
    const result = HeaderSchema.parse({ title: 'Detail', leftAction: headerAction })
    expect(result.leftAction?.icon).toBe('search')
  })

  it('accepts rightAction', () => {
    const result = HeaderSchema.parse({ title: 'Home', rightAction: headerAction })
    expect(result.rightAction?.icon).toBe('search')
  })

  it('accepts rightActions array up to 2', () => {
    const result = HeaderSchema.parse({
      title: 'Home',
      rightActions: [headerAction, { icon: 'bell', label: 'Notifications', action }],
    })
    expect(result.rightActions).toHaveLength(2)
  })

  it('rejects rightActions with more than 2 items', () => {
    expect(HeaderSchema.safeParse({
      title: 'Home',
      rightActions: [headerAction, headerAction, headerAction],
    }).success).toBe(false)
  })

  it('headerAction requires icon and label (action is z.custom — runtime-transparent)', () => {
    // z.custom<Action>() has no runtime validator, so only icon and label are enforced
    expect(HeaderSchema.safeParse({ title: 'x', leftAction: { icon: 'x' } }).success).toBe(false)
    expect(HeaderSchema.safeParse({ title: 'x', leftAction: { label: 'X' } }).success).toBe(false)
  })
})
