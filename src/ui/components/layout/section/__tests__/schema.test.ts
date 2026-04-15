import { describe, it, expect } from 'vitest'
import { SectionSchema } from '../schema'

describe('SectionSchema', () => {
  it('parses a minimal valid config', () => {
    expect(SectionSchema.safeParse({}).success).toBe(true)
  })

  it('applies defaults', () => {
    const result = SectionSchema.parse({})
    expect(result.padding).toBe('lg')
    expect(result.titleSize).toBe('md')
  })

  it('parses a full config', () => {
    const result = SectionSchema.parse({
      id: 'profile-section',
      title: 'Profile',
      description: 'Manage your profile',
      padding: 'xl',
      titleSize: 'lg',
      testID: 'profile-section',
    })
    expect(result.title).toBe('Profile')
    expect(result.titleSize).toBe('lg')
  })

  it('rejects invalid titleSize', () => {
    expect(SectionSchema.safeParse({ titleSize: 'huge' }).success).toBe(false)
  })
})
