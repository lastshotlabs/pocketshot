import { describe, expect, it, vi } from 'vitest'
import {
  createManifestResourceQueryKey,
  invalidateManifestResource,
  invalidateManifestRefreshTarget,
  resolveManifestResourceTarget,
} from '../../src/ui/manifest/resources'

describe('manifest resources runtime', () => {
  it('resolves resource refs into request metadata and urls', () => {
    const result = resolveManifestResourceTarget(
      {
        resource: 'users.detail',
        params: {
          orgId: 7,
          userId: 42,
        },
      },
      {
        'users.detail': {
          method: 'GET',
          endpoint: '/api/orgs/{orgId}/users/{userId}',
          params: {
            include: 'profile',
          },
        },
      },
    )

    expect(result.resourceName).toBe('users.detail')
    expect(result.request.method).toBe('GET')
    expect(result.url).toBe('/api/orgs/7/users/42?include=profile')
  })

  it('creates stable resource query keys', () => {
    expect(createManifestResourceQueryKey('users.list', { b: 2, a: 1 })).toEqual([
      'manifest-resource',
      'users.list',
      { a: 1, b: 2 },
    ])
  })

  it('invalidates a resource and its dependent resource targets', async () => {
    const matches: string[] = []
    const queries = [
      { queryKey: ['manifest-resource', 'users.create', {}] as const },
      { queryKey: ['manifest-resource', 'users.list', {}] as const },
      { queryKey: ['manifest-resource', 'dashboard', {}] as const },
      { queryKey: ['componentData', 'GET', '/api/users', null] as const },
    ]

    await invalidateManifestResource(
      {
        invalidateQueries: vi.fn(async (filters) => {
          for (const query of queries) {
            if (filters?.predicate?.(query)) {
              matches.push(String(query.queryKey[1]))
            }
          }
        }),
      },
      'users.create',
      {
        'users.create': {
          method: 'POST',
          endpoint: '/api/users',
          invalidates: ['users.list'],
        },
        'users.list': {
          method: 'GET',
          endpoint: '/api/users',
        },
        dashboard: {
          method: 'GET',
          endpoint: '/api/dashboard',
          dependsOn: ['users.list'],
        },
      },
    )

    expect(matches).toEqual(['users.create', 'users.list', 'dashboard'])
  })

  it('supports refresh targets that point at resources', async () => {
    const calls = vi.fn(async () => undefined)

    await invalidateManifestRefreshTarget(
      {
        invalidateQueries: calls,
      },
      'resource:users.list, screen:detail',
      {
        'users.list': {
          method: 'GET',
          endpoint: '/api/users',
        },
      },
    )

    expect(calls).toHaveBeenCalled()
  })
})
