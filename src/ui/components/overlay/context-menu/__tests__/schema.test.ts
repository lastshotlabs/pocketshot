import { describe, expect, it } from 'vitest'
import { ContextMenuSchema } from '../schema'

describe('ContextMenuSchema', () => {
  it('accepts a minimal valid config', () => {
    expect(
      ContextMenuSchema.parse({
        items: [
          { id: 'open', label: 'Open', onPress: { type: 'set-value', target: 'menu.open', value: true } },
        ],
      }),
    ).toBeDefined()
  })

  it('accepts slot surfaces and destructive items', () => {
    expect(
      ContextMenuSchema.parse({
        id: 'file-menu',
        triggerLabel: 'File actions',
        items: [
          { id: 'open', label: 'Open', onPress: { type: 'set-value', target: 'menu.open', value: true } },
          { id: 'delete', label: 'Delete', destructive: true, onPress: { type: 'set-value', target: 'menu.delete', value: true } },
        ],
        slots: {
          panel: { bg: 'card' },
          itemLabel: { letterSpacing: 'wide' },
        },
      }),
    ).toBeDefined()
  })
})
