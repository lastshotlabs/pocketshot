import { describe, it, expect } from 'vitest'
import { StackSchema } from '../schema'

describe('StackSchema', () => {
  it('parses a minimal valid config', () => {
    const result = StackSchema.safeParse({})
    expect(result.success).toBe(true)
  })

  it('applies defaults', () => {
    const result = StackSchema.parse({})
    expect(result.gap).toBe(0)
    expect(result.alignItems).toBe('stretch')
    expect(result.justifyContent).toBe('start')
  })

  it('parses a full config', () => {
    const result = StackSchema.parse({
      id: 'main-stack',
      gap: 8,
      padding: 'lg',
      paddingX: 'md',
      paddingY: 'sm',
      alignItems: 'center',
      justifyContent: 'between',
      bg: '#ffffff',
      testID: 'main-stack',
    })
    expect(result.id).toBe('main-stack')
    expect(result.gap).toBe(8)
    expect(result.alignItems).toBe('center')
    expect(result.justifyContent).toBe('between')
  })

  it('accepts named slot styling surfaces', () => {
    const result = StackSchema.parse({
      slots: {
        root: {
          bg: 'card',
        },
        item: {
          paddingY: 'sm',
        },
      },
    })

    expect(result.slots?.root).toMatchObject({ bg: 'card' })
    expect(result.slots?.item).toMatchObject({ paddingY: 'sm' })
  })

  it('rejects invalid alignItems value', () => {
    const result = StackSchema.safeParse({ alignItems: 'invalid' })
    expect(result.success).toBe(false)
  })

  it('rejects invalid justifyContent value', () => {
    const result = StackSchema.safeParse({ justifyContent: 'invalid' })
    expect(result.success).toBe(false)
  })

  it('accepts token gap values', () => {
    const result = StackSchema.safeParse({ gap: 'lg' })
    expect(result.success).toBe(true)
  })

  it('accepts children array', () => {
    const result = StackSchema.parse({ children: [{ type: 'Heading' }] })
    expect(result.children).toHaveLength(1)
  })

  it('all fields are optional', () => {
    expect(StackSchema.safeParse({}).success).toBe(true)
  })
})
