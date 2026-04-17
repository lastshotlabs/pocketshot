import { describe, it, expect } from 'vitest'
import { AccordionSchema } from '../schema'

describe('AccordionSchema', () => {
  it('parses a minimal valid config', () => {
    const result = AccordionSchema.parse({
      sections: [{ id: 'overview', title: 'Overview' }],
    })
    expect(result.sections).toHaveLength(1)
  })

  it('applies defaults', () => {
    const result = AccordionSchema.parse({
      sections: [{ id: 'overview', title: 'Overview' }],
    })
    expect(result.allowMultiple).toBe(true)
    expect(result.variant).toBe('default')
  })

  it('accepts slot surfaces', () => {
    const result = AccordionSchema.parse({
      sections: [{ id: 'overview', title: 'Overview' }],
      slots: {
        container: { borderRadius: 'lg' },
        title: { letterSpacing: 'wide' },
        body: { paddingY: 'sm' },
      },
    })

    expect(result.slots?.container?.borderRadius).toBe('lg')
    expect(result.slots?.title?.letterSpacing).toBe('wide')
    expect(result.slots?.body?.paddingY).toBe('sm')
  })
})
