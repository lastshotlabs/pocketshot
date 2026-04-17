import { describe, it, expect } from 'vitest'
import { CommandPaletteSchema } from '../schema'

describe('CommandPaletteSchema', () => {
  it('parses a minimal valid config', () => {
    const result = CommandPaletteSchema.parse({
      id: 'commands',
      items: [{ id: 'open', label: 'Open', onSelect: { type: 'set-value', target: 'cmd.open', value: true } }],
    })
    expect(result.id).toBe('commands')
  })

  it('requires id and items', () => {
    expect(CommandPaletteSchema.safeParse({}).success).toBe(false)
  })

  it('applies defaults', () => {
    const result = CommandPaletteSchema.parse({
      id: 'commands',
      items: [{ id: 'open', label: 'Open', onSelect: { type: 'set-value', target: 'cmd.open', value: true } }],
    })
    expect(result.placeholder).toBe('Type a command...')
    expect(result.maxResults).toBe(20)
  })

  it('accepts slot surfaces', () => {
    const result = CommandPaletteSchema.parse({
      id: 'commands',
      items: [{ id: 'open', label: 'Open', onSelect: { type: 'set-value', target: 'cmd.open', value: true } }],
      slots: {
        panel: { bg: 'card' },
        searchInput: { color: 'foreground' },
        itemLabel: { letterSpacing: 'wide' },
      },
    })

    expect(result.slots?.panel?.bg).toBe('card')
    expect(result.slots?.searchInput?.color).toBe('foreground')
    expect(result.slots?.itemLabel?.letterSpacing).toBe('wide')
  })
})
