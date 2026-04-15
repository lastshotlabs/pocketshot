import { beforeEach, describe, expect, it, vi } from 'vitest'

vi.mock('react-native', () => ({
  Linking: {
    openURL: vi.fn(async () => undefined),
  },
}))

import { executeAction, type ActionExecutorDeps } from '../../src/ui/actions/executor'

describe('action executor', () => {
  const createDeps = () => {
    const values: Record<string, unknown> = {
      userId: 42,
      orgId: 7,
      name: 'Ada',
    }

    const deps: ActionExecutorDeps = {
      api: {
        get: vi.fn(async () => ({ ok: true })),
        post: vi.fn(async () => ({ ok: true })),
        put: vi.fn(async () => ({ ok: true })),
        patch: vi.fn(async () => ({ ok: true })),
        delete: vi.fn(async () => ({ ok: true })),
      },
      queryClient: {
        invalidateQueries: vi.fn(async () => undefined),
      },
      resources: {
        'users.create': {
          method: 'POST' as const,
          endpoint: '/api/orgs/{orgId}/users',
          invalidates: ['users.list'],
        },
        'users.list': {
          method: 'GET' as const,
          endpoint: '/api/orgs/{orgId}/users',
        },
      },
      workflows: {
        'users.after-save': [
          {
            type: 'set-value' as const,
            target: 'status',
            value: 'saved {result.ok}',
          },
          {
            type: 'toast' as const,
            message: 'Saved {name}',
          },
        ],
      },
      setTheme: vi.fn(),
      router: {
        push: vi.fn(),
        replace: vi.fn(),
      },
      screenContext: {
        values,
        getValue: (key: string) => values[key],
        setValue: (key: string, value: unknown) => {
          values[key] = value
        },
        dispatch: vi.fn(async () => undefined),
      },
    }

    return {
      values,
      deps,
    }
  }

  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('executes canonical navigate actions and interpolates route templates', async () => {
    const { deps } = createDeps()

    await executeAction(
      {
        type: 'navigate',
        to: '/orgs/{orgId}/users/{userId}',
      },
      deps,
    )

    expect(deps.router.push).toHaveBeenCalledWith('/orgs/7/users/42')
  })

  it('resolves resource-backed api actions and invalidates named resources', async () => {
    const { deps } = createDeps()

    await executeAction(
      {
        type: 'api',
        method: 'POST',
        endpoint: {
          resource: 'users.create',
          params: {
            orgId: { from: 'orgId' },
          },
        },
        body: {
          name: '{name}',
        },
        invalidates: ['users.list'],
      },
      deps,
    )

    expect(deps.api.post).toHaveBeenCalledWith('/api/orgs/7/users', { name: 'Ada' })
    expect(deps.queryClient.invalidateQueries).toHaveBeenCalled()
  })

  it('executes shared workflows through run-workflow actions', async () => {
    const { deps, values } = createDeps()

    await executeAction(
      {
        type: 'run-workflow',
        workflow: 'users.after-save',
        input: {
          result: { ok: true },
        },
      },
      deps,
    )

    expect(values.status).toBe('saved true')
    expect(values.__toast).toMatchObject({
      message: 'Saved Ada',
      variant: 'info',
    })
  })

  it('routes set-theme actions through the app theme controller', async () => {
    const { deps } = createDeps()

    await executeAction(
      {
        type: 'set-theme',
        mode: 'dark',
        flavor: 'ocean',
      },
      deps,
    )

    expect(deps.setTheme).toHaveBeenCalledWith({
      mode: 'dark',
      flavor: 'ocean',
    })
  })
})
