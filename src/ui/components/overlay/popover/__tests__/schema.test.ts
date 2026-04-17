import { describe, expect, it } from 'vitest'
import { PopoverSchema } from '../schema'

describe('PopoverSchema', () => {
  it('accepts a minimal valid config', () => {
    expect(
      PopoverSchema.parse({
        id: 'info-popover',
        triggerLabel: 'Open',
        content: 'Details',
      }),
    ).toBeDefined()
  })

  it('accepts slot surfaces and position settings', () => {
    expect(
      PopoverSchema.parse({
        id: 'info-popover',
        triggerLabel: 'Open',
        content: 'Details',
        position: 'top',
        slots: {
          trigger: {
            paddingY: 'sm',
          },
          panel: {
            bg: 'card',
          },
          content: {
            letterSpacing: 'wide',
          },
        },
      }),
    ).toBeDefined()
  })
})
