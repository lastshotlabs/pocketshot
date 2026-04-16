import { describe, expect, it } from 'vitest'
import { DetailCardSchema } from '../schema'

describe('DetailCardSchema', () => {
  it('parses a minimal valid config', () => {
    const result = DetailCardSchema.parse({
      sections: [
        {
          fields: [{ label: 'Name', value: 'Taylor' }],
        },
      ],
    })

    expect(result.sections).toHaveLength(1)
  })

  it('accepts title and subtitle from refs', () => {
    const result = DetailCardSchema.parse({
      title: { from: 'profile.title' },
      subtitle: { from: 'profile.subtitle' },
      sections: [
        {
          fields: [{ label: 'Name', value: { from: 'profile.name' } }],
        },
      ],
    })

    expect(result.title).toEqual({ from: 'profile.title' })
    expect(result.subtitle).toEqual({ from: 'profile.subtitle' })
  })

  it('accepts top-level and field slot styling surfaces', () => {
    const result = DetailCardSchema.parse({
      title: 'Profile',
      sections: [
        {
          fields: [
            {
              label: 'Email',
              value: 'a@example.com',
              slots: {
                fieldLabel: {
                  color: 'muted',
                },
              },
            },
          ],
        },
      ],
      slots: {
        panel: {
          bg: 'card',
        },
        title: {
          letterSpacing: 'wide',
        },
        actionButton: {
          paddingX: 'sm',
        },
        fieldValue: {
          color: 'primary',
        },
      },
    })

    expect(result.slots?.panel).toMatchObject({ bg: 'card' })
    expect(result.sections[0]?.fields[0]?.slots?.fieldLabel).toMatchObject({ color: 'muted' })
  })
})
