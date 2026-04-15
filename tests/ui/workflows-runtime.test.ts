import { describe, expect, it } from 'vitest'
import { runWorkflow } from '../../src/ui/workflows'

describe('workflow runtime', () => {
  it('supports assign, capture, if, and nested run-workflow semantics', async () => {
    const executed: Array<{ type: string; context: Record<string, unknown> }> = []

    await runWorkflow(
      {
        type: 'run-workflow',
        workflow: 'save.user',
        input: {
          id: 42,
          name: 'Ada',
        },
      },
      {
        workflows: {
          'save.user': [
            {
              type: 'assign',
              values: {
                greeting: 'Hello {name}',
              },
            },
            {
              type: 'capture',
              as: 'request',
              action: {
                type: 'api',
                method: 'POST',
                endpoint: '/api/users/{id}',
                body: {
                  name: '{name}',
                },
              },
            },
            {
              type: 'if',
              condition: {
                left: '{request.ok}',
                operator: 'equals',
                right: 'true',
              },
              then: {
                type: 'set-value',
                target: 'status',
                value: '{greeting}',
              },
              else: {
                type: 'set-value',
                target: 'status',
                value: 'failed',
              },
            },
          ],
        },
        context: {},
        resolveValue: (value, context) => {
          if (typeof value === 'string') {
            return value.replace(/\{([^}]+)\}/g, (_, token: string) => String(context[token] ?? ''))
          }
          if (value && typeof value === 'object' && !Array.isArray(value)) {
            return Object.fromEntries(
              Object.entries(value as Record<string, unknown>).map(([key, nested]) => [
                key,
                typeof nested === 'string'
                  ? nested.replace(/\{([^}]+)\}/g, (_, token: string) =>
                      String(context[token] ?? ''),
                    )
                  : nested,
              ]),
            )
          }
          return value
        },
        executeAction: async (action, context) => {
          executed.push({ type: action.type, context: { ...context } })
          if (action.type === 'api') {
            return { ok: 'true' }
          }
          return undefined
        },
      },
    )

    expect(executed.map((entry) => entry.type)).toEqual(['api', 'set-value'])
    expect(executed[1]?.context.status).toBeUndefined()
    expect(executed[1]?.context.greeting).toBe('Hello Ada')
    expect(executed[1]?.context.request).toEqual({ ok: 'true' })
  })
})
