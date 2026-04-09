import { describe, it, expect } from 'vitest'
import { ModalSchema } from '../schema'

describe('ModalSchema', () => {
  it('parses a minimal valid config', () => {
    const result = ModalSchema.parse({ id: 'confirm-modal' })
    expect(result.id).toBe('confirm-modal')
  })

  it('requires id', () => {
    expect(ModalSchema.safeParse({}).success).toBe(false)
  })

  it('applies defaults', () => {
    const result = ModalSchema.parse({ id: 'x' })
    expect(result.size).toBe('md')
    expect(result.showCloseButton).toBe(true)
    expect(result.closeOnBackdrop).toBe(true)
  })

  it('accepts all valid sizes', () => {
    for (const size of ['sm', 'md', 'lg', 'full'] as const) {
      expect(ModalSchema.safeParse({ id: 'x', size }).success).toBe(true)
    }
  })

  it('rejects invalid size', () => {
    expect(ModalSchema.safeParse({ id: 'x', size: 'xl' }).success).toBe(false)
  })

  it('accepts title', () => {
    const result = ModalSchema.parse({ id: 'x', title: 'Confirm Action' })
    expect(result.title).toBe('Confirm Action')
  })
})
