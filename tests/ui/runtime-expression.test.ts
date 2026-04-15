import { describe, expect, it } from 'vitest'

import { evaluateRuntimeExpression } from '../../src/ui/runtime/expression'
import { resolveRuntimeValue } from '../../src/ui/runtime/resolve'

describe('runtime expression resolution', () => {
  it('evaluates shared expr refs against merged runtime scope', () => {
    const result = resolveRuntimeValue(
      {
        visible: { expr: 'defined(user.name) && count > 1' },
        title: '{user.name}',
      },
      {
        values: {
          count: 3,
        },
        context: {
          user: {
            name: 'Ada',
          },
        },
      },
    )

    expect(result).toEqual({
      visible: true,
      title: 'Ada',
    })
  })

  it('supports snapshot-style visibility helpers for visibleWhen expressions', () => {
    expect(
      evaluateRuntimeExpression('defined(route.query.token)', {
        route: {
          query: {
            token: 'abc123',
          },
        },
      }),
    ).toBe(true)

    expect(
      evaluateRuntimeExpression('empty(route.query.token)', {
        route: {
          query: {},
        },
      }),
    ).toBe(true)
  })
})
