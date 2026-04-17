import { describe, expect, it } from 'vitest'
import { CompareViewSchema } from '../schema'

describe('CompareViewSchema', () => {
  it('parses a basic side-by-side diff', () => {
    const result = CompareViewSchema.parse({
      left: { label: 'Before', content: 'one\ntwo' },
      right: { label: 'After', content: 'one\nthree' },
    })

    expect(result.mode).toBe('side-by-side')
    expect(result.showLineNumbers).toBe(true)
    expect(result.highlightDiffs).toBe(true)
  })

  it('accepts inline mode', () => {
    const result = CompareViewSchema.parse({
      left: { label: 'Left', content: 'a' },
      right: { label: 'Right', content: 'b' },
      mode: 'inline',
    })

    expect(result.mode).toBe('inline')
  })

  it('accepts slot styling surfaces', () => {
    const result = CompareViewSchema.parse({
      left: { label: 'Before', content: 'a' },
      right: { label: 'After', content: 'b' },
      slots: {
        header: { paddingY: 'sm' },
        panelLabel: { color: 'primary' },
        panelLineRow: { states: { selected: { bg: 'accent' } } },
      },
    })

    expect(result.slots?.header?.paddingY).toBe('sm')
    expect(result.slots?.panelLabel?.color).toBe('primary')
    expect(result.slots?.panelLineRow?.states?.selected?.bg).toBe('accent')
  })
})
