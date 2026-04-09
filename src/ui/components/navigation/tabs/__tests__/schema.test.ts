import { describe, it, expect } from 'vitest'
import { TabsSchema } from '../schema'

const baseTabs = [
  { id: 'home', label: 'Home' },
  { id: 'profile', label: 'Profile' },
]

describe('TabsSchema', () => {
  it('parses a valid config', () => {
    const result = TabsSchema.parse({ id: 'main-tabs', tabs: baseTabs })
    expect(result.tabs).toHaveLength(2)
  })

  it('requires id', () => {
    expect(TabsSchema.safeParse({ tabs: baseTabs }).success).toBe(false)
  })

  it('requires tabs', () => {
    expect(TabsSchema.safeParse({ id: 'tabs' }).success).toBe(false)
  })

  it('applies default variant', () => {
    const result = TabsSchema.parse({ id: 'x', tabs: baseTabs })
    expect(result.variant).toBe('default')
  })

  it('accepts all valid variants', () => {
    for (const variant of ['default', 'pills', 'underline'] as const) {
      expect(TabsSchema.safeParse({ id: 'x', tabs: baseTabs, variant }).success).toBe(true)
    }
  })

  it('rejects invalid variant', () => {
    expect(TabsSchema.safeParse({ id: 'x', tabs: baseTabs, variant: 'bordered' }).success).toBe(false)
  })

  it('accepts from-ref activeTab', () => {
    const result = TabsSchema.parse({ id: 'x', tabs: baseTabs, activeTab: { from: 'nav' } })
    expect(result.activeTab).toEqual({ from: 'nav' })
  })

  it('accepts string activeTab', () => {
    const result = TabsSchema.parse({ id: 'x', tabs: baseTabs, activeTab: 'home' })
    expect(result.activeTab).toBe('home')
  })

  it('tab requires id and label', () => {
    expect(TabsSchema.safeParse({ id: 'x', tabs: [{ label: 'Home' }] }).success).toBe(false)
    expect(TabsSchema.safeParse({ id: 'x', tabs: [{ id: 'home' }] }).success).toBe(false)
  })

  it('accepts optional tab icon', () => {
    const result = TabsSchema.parse({ id: 'x', tabs: [{ id: 'home', label: 'Home', icon: 'home-outline' }] })
    expect(result.tabs[0].icon).toBe('home-outline')
  })
})
