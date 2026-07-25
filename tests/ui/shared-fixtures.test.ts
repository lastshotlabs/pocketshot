import { readFileSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import { beforeEach, describe, expect, it, vi } from 'vitest'

vi.mock('react-native', () => ({
  Linking: {
    openURL: vi.fn(async () => undefined),
  },
}))

import { executeAction, type ActionExecutorDeps } from '../../src/ui/actions/executor'

function readSharedFixture<T>(relativePath: string): T {
  return JSON.parse(
    readFileSync(
      fileURLToPath(new URL(`../fixtures/frontend-contract/${relativePath}`, import.meta.url).href),
      'utf8',
    ),
  ) as T
}

function createDeps() {
  const values: Record<string, unknown> = {
    filters: { orgId: 7 },
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

describe('shared frontend-contract fixtures in Pocketshot', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('executes the shared data fixture against Pocketshot resource helpers', async () => {
    const fixture = readSharedFixture<{
      resources: Record<string, unknown>
      actions: Record<string, unknown>
    }>('data/resource-list.json')
    const { deps } = createDeps()

    deps.resources = fixture.resources as typeof deps.resources

    await executeAction(fixture.actions['load-users'] as never, deps)
    await executeAction(fixture.actions['refresh-users'] as never, deps)

    expect(deps.api.get).toHaveBeenCalledWith('/api/orgs/7/users?limit=20')
    expect(deps.queryClient.invalidateQueries).toHaveBeenCalled()
  })

  it('executes the shared workflow fixture against Pocketshot workflow runtime', async () => {
    const fixture = readSharedFixture<{
      workflows: Record<string, unknown>
    }>('workflows/retry-capture.json')
    const { deps, values } = createDeps()

    deps.workflows = fixture.workflows as typeof deps.workflows

    await executeAction(
      {
        type: 'run-workflow',
        workflow: 'users.save',
        input: {
          form: {
            name: 'Ada',
          },
        },
      },
      deps,
    )

    expect(deps.api.post).toHaveBeenCalledWith('/api/users', { name: 'Ada' })
    expect(values.__toast).toMatchObject({
      message: 'Saved Ada',
      variant: 'success',
    })
  })
})
