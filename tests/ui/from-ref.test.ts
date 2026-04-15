import { describe, expect, it } from 'vitest'

import { isFromRef, resolveFromRef } from '../../src/ui/components/_base/fromRef'

describe('pocketshot from-ref contract', () => {
  it('resolves nested screen value paths', () => {
    const values = {
      profile: {
        displayName: 'Ada',
      },
    }

    expect(
      resolveFromRef(
        {
          from: 'profile.displayName',
        },
        values,
      ),
    ).toBe('Ada')
  })

  it('applies shared transforms during resolution', () => {
    const values = {
      profile: {
        displayName: '  Ada Lovelace  ',
      },
      tags: ['ios', 'camera'],
    }

    expect(
      resolveFromRef(
        {
          from: 'profile.displayName',
          transform: 'trim',
        },
        values,
      ),
    ).toBe('Ada Lovelace')

    expect(
      resolveFromRef(
        {
          from: 'tags',
          transform: 'join',
          transformArg: ' | ',
        },
        values,
      ),
    ).toBe('ios | camera')
  })

  it('retains the shared from-ref guard', () => {
    expect(isFromRef({ from: 'profile.displayName' })).toBe(true)
    expect(isFromRef({ expr: 'profile.displayName' })).toBe(false)
  })
})
