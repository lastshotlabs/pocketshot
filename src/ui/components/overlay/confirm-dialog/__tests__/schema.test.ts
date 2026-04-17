import { describe, expect, it } from 'vitest'
import { ConfirmDialogSchema } from '../schema'

describe('ConfirmDialogSchema', () => {
  it('accepts a minimal valid config', () => {
    expect(
      ConfirmDialogSchema.parse({
        id: 'confirm-delete',
        title: 'Delete item',
        message: 'This cannot be undone.',
        onConfirm: { type: 'set-value', target: 'confirm.ok', value: true },
      }),
    ).toBeDefined()
  })

  it('accepts slot surfaces and destructive variant', () => {
    expect(
      ConfirmDialogSchema.parse({
        id: 'confirm-delete',
        title: 'Delete item',
        message: 'This cannot be undone.',
        variant: 'destructive',
        onConfirm: { type: 'set-value', target: 'confirm.ok', value: true },
        onCancel: { type: 'set-value', target: 'confirm.cancel', value: true },
        slots: {
          panel: {
            bg: 'card',
          },
          title: {
            letterSpacing: 'wide',
          },
          confirmText: {
            fontWeight: 'bold',
          },
        },
      }),
    ).toBeDefined()
  })
})
