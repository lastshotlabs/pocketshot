import { describe, it, expect, vi, beforeEach } from 'vitest'

vi.mock('@tanstack/react-query', () => ({
  useQuery: vi.fn(),
  useCallback: vi.fn(),
  QueryClient: vi.fn(),
}))
vi.mock('react', async (importOriginal) => {
  const actual = await importOriginal<typeof import('react')>()
  return {
    ...actual,
    useCallback: (fn: unknown) => fn,
  }
})

import { useQuery } from '@tanstack/react-query'
import { createPermissionHooks } from '../../src/permissions/hooks'
import type { ApiClient } from '../../src/api/client'

const mockUseQuery = useQuery as ReturnType<typeof vi.fn>

function makeApi(): ApiClient {
  return { get: vi.fn(), post: vi.fn(), put: vi.fn(), patch: vi.fn(), delete: vi.fn(), fetch: vi.fn() } as unknown as ApiClient
}

describe('createPermissionHooks factory shape', () => {
  it('returns all expected hooks', () => {
    const hooks = createPermissionHooks(makeApi())
    expect(typeof hooks.useAccessClaims).toBe('function')
    expect(typeof hooks.useHasRole).toBe('function')
    expect(typeof hooks.useHasPermission).toBe('function')
    expect(typeof hooks.useHasOrgRole).toBe('function')
    expect(typeof hooks.useHasOrgPermission).toBe('function')
    expect(typeof hooks.usePermissionChecker).toBe('function')
    expect(typeof hooks.usePermissionGuard).toBe('function')
  })

  it('uses default endpoint /auth/permissions', () => {
    const api = makeApi()
    mockUseQuery.mockReturnValue({ data: null, isLoading: false })
    const hooks = createPermissionHooks(api)
    hooks.useAccessClaims()
    expect(mockUseQuery).toHaveBeenCalledWith(expect.objectContaining({
      queryKey: ['auth', 'permissions'],
    }))
  })

  it('accepts a custom endpoint', () => {
    const api = makeApi()
    mockUseQuery.mockReturnValue({ data: null, isLoading: false })
    const hooks = createPermissionHooks(api, { endpoint: '/v2/permissions' })
    hooks.useAccessClaims()
    const call = mockUseQuery.mock.calls[mockUseQuery.mock.calls.length - 1]![0] as { queryFn: () => unknown }
    call.queryFn()
    expect(api.get).toHaveBeenCalledWith('/v2/permissions')
  })
})

describe('useHasRole', () => {
  beforeEach(() => vi.clearAllMocks())

  it('returns false when claims is null', () => {
    mockUseQuery.mockReturnValue({ data: null, isLoading: false })
    const { useHasRole } = createPermissionHooks(makeApi())
    expect(useHasRole('admin')).toBe(false)
  })

  it('returns true when the user has the role', () => {
    mockUseQuery.mockReturnValue({
      data: { roles: ['admin', 'user'], permissions: [], orgRoles: {}, orgPermissions: {} },
      isLoading: false,
    })
    const { useHasRole } = createPermissionHooks(makeApi())
    expect(useHasRole('admin')).toBe(true)
  })

  it('returns false when the user does not have the role', () => {
    mockUseQuery.mockReturnValue({
      data: { roles: ['user'], permissions: [], orgRoles: {}, orgPermissions: {} },
      isLoading: false,
    })
    const { useHasRole } = createPermissionHooks(makeApi())
    expect(useHasRole('admin')).toBe(false)
  })

  it('returns true when any one of multiple roles matches (OR logic)', () => {
    mockUseQuery.mockReturnValue({
      data: { roles: ['moderator'], permissions: [], orgRoles: {}, orgPermissions: {} },
      isLoading: false,
    })
    const { useHasRole } = createPermissionHooks(makeApi())
    expect(useHasRole('admin', 'moderator')).toBe(true)
  })
})

describe('useHasPermission', () => {
  beforeEach(() => vi.clearAllMocks())

  it('returns false when claims is null', () => {
    mockUseQuery.mockReturnValue({ data: null, isLoading: false })
    const { useHasPermission } = createPermissionHooks(makeApi())
    expect(useHasPermission('posts:create')).toBe(false)
  })

  it('returns true when user has the permission', () => {
    mockUseQuery.mockReturnValue({
      data: { roles: [], permissions: ['posts:create', 'posts:read'], orgRoles: {}, orgPermissions: {} },
      isLoading: false,
    })
    const { useHasPermission } = createPermissionHooks(makeApi())
    expect(useHasPermission('posts:create')).toBe(true)
  })

  it('OR logic by default — any permission match returns true', () => {
    mockUseQuery.mockReturnValue({
      data: { roles: [], permissions: ['posts:read'], orgRoles: {}, orgPermissions: {} },
      isLoading: false,
    })
    const { useHasPermission } = createPermissionHooks(makeApi())
    expect(useHasPermission(['posts:create', 'posts:read'])).toBe(true)
  })

  it('AND logic when requireAll is true', () => {
    mockUseQuery.mockReturnValue({
      data: { roles: [], permissions: ['posts:read'], orgRoles: {}, orgPermissions: {} },
      isLoading: false,
    })
    const { useHasPermission } = createPermissionHooks(makeApi())
    expect(useHasPermission(['posts:create', 'posts:read'], { requireAll: true })).toBe(false)
  })
})

describe('useHasOrgRole', () => {
  beforeEach(() => vi.clearAllMocks())

  it('returns true when user has the org role', () => {
    mockUseQuery.mockReturnValue({
      data: { roles: [], permissions: [], orgRoles: { 'org-1': ['owner'] }, orgPermissions: {} },
      isLoading: false,
    })
    const { useHasOrgRole } = createPermissionHooks(makeApi())
    expect(useHasOrgRole('org-1', 'owner')).toBe(true)
  })

  it('returns false when user has a different org role', () => {
    mockUseQuery.mockReturnValue({
      data: { roles: [], permissions: [], orgRoles: { 'org-1': ['member'] }, orgPermissions: {} },
      isLoading: false,
    })
    const { useHasOrgRole } = createPermissionHooks(makeApi())
    expect(useHasOrgRole('org-1', 'owner')).toBe(false)
  })

  it('returns false for a different org', () => {
    mockUseQuery.mockReturnValue({
      data: { roles: [], permissions: [], orgRoles: { 'org-1': ['owner'] }, orgPermissions: {} },
      isLoading: false,
    })
    const { useHasOrgRole } = createPermissionHooks(makeApi())
    expect(useHasOrgRole('org-2', 'owner')).toBe(false)
  })
})
