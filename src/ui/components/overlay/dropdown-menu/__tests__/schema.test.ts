import { describe, expect, it } from 'vitest'
import { DropdownMenuSchema } from '../schema'

describe('DropdownMenuSchema', () => {
  it('accepts a minimal valid config', () => {
    expect(
      DropdownMenuSchema.parse({
        trigger: { label: 'Actions' },
        items: [
          {
            id: 'edit',
            label: 'Edit',
            onPress: { type: 'set-value', target: 'menu.edit', value: true },
          },
        ],
      }),
    ).toBeDefined()
  })

  it('accepts slot surfaces and disabled/destructive items', () => {
    expect(
      DropdownMenuSchema.parse({
        id: 'actions-menu',
        trigger: { label: 'Actions', icon: 'more' },
        align: 'end',
        items: [
          {
            id: 'edit',
            label: 'Edit',
            onPress: { type: 'set-value', target: 'menu.edit', value: true },
          },
          {
            id: 'delete',
            label: 'Delete',
            destructive: true,
            onPress: { type: 'set-value', target: 'menu.delete', value: true },
          },
        ],
        slots: {
          trigger: { paddingY: 'sm' },
          panel: { bg: 'card' },
          itemLabel: { letterSpacing: 'wide' },
        },
      }),
    ).toBeDefined()
  })
})
