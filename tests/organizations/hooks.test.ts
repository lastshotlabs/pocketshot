import { describe, it, expect, vi, beforeEach } from 'vitest'

vi.mock('@tanstack/react-query', () => ({
  useQuery: vi.fn(),
  useMutation: vi.fn((opts: any) => ({ _opts: opts })),
  useQueryClient: vi.fn(() => ({ invalidateQueries: vi.fn() })),
}))

import { useQuery, useMutation } from '@tanstack/react-query'
import { createOrgHooks } from '../../src/organizations/hooks'
import type { ApiClient } from '../../src/api/client'

const mockUseQuery = useQuery as ReturnType<typeof vi.fn>
const mockUseMutation = useMutation as ReturnType<typeof vi.fn>

function makeApi(): ApiClient {
  return { get: vi.fn(), post: vi.fn(), put: vi.fn(), patch: vi.fn(), delete: vi.fn(), fetch: vi.fn() } as unknown as ApiClient
}

describe('createOrgHooks factory shape', () => {
  it('returns all expected hooks', () => {
    const hooks = createOrgHooks(makeApi())
    const expected = [
      'useOrganizations', 'useOrganization', 'useCreateOrganization', 'useUpdateOrganization', 'useDeleteOrganization',
      'useOrgMembers', 'useInviteMember', 'useRevokeInvite', 'useOrgInvites',
      'useUpdateMemberRole', 'useRemoveMember', 'useLeaveOrganization',
    ]
    for (const name of expected) {
      expect(typeof (hooks as Record<string, unknown>)[name]).toBe('function')
    }
  })
})

describe('useOrganizations', () => {
  beforeEach(() => vi.clearAllMocks())

  it('queries with the orgs query key', () => {
    mockUseQuery.mockReturnValue({ data: undefined, isLoading: false })
    const { useOrganizations } = createOrgHooks(makeApi())
    useOrganizations()
    expect(mockUseQuery).toHaveBeenCalledWith(expect.objectContaining({
      queryKey: expect.arrayContaining(['orgs']),
    }))
  })

  it('calls api.get with the org list endpoint', () => {
    const api = makeApi()
    mockUseQuery.mockReturnValue({ data: undefined, isLoading: false })
    const { useOrganizations } = createOrgHooks(api)
    useOrganizations()
    const opts = mockUseQuery.mock.calls[0]![0] as { queryFn: () => void }
    opts.queryFn()
    expect(api.get).toHaveBeenCalledWith(expect.stringMatching(/\/orgs/))
  })

  it('appends pagination query params', () => {
    const api = makeApi()
    mockUseQuery.mockReturnValue({ data: undefined, isLoading: false })
    const { useOrganizations } = createOrgHooks(api)
    useOrganizations({ limit: 10, offset: 20 })
    const opts = mockUseQuery.mock.calls[0]![0] as { queryFn: () => void }
    opts.queryFn()
    const url = (api.get as ReturnType<typeof vi.fn>).mock.calls[0][0] as string
    expect(url).toContain('limit=10')
    expect(url).toContain('offset=20')
  })
})

describe('useOrganization', () => {
  beforeEach(() => vi.clearAllMocks())

  it('queries with org-specific key', () => {
    mockUseQuery.mockReturnValue({ data: undefined, isLoading: false })
    const { useOrganization } = createOrgHooks(makeApi())
    useOrganization('org-123')
    expect(mockUseQuery).toHaveBeenCalledWith(expect.objectContaining({
      queryKey: ['orgs', 'org-123'],
    }))
  })

  it('is disabled when orgId is empty', () => {
    mockUseQuery.mockReturnValue({ data: undefined, isLoading: false })
    const { useOrganization } = createOrgHooks(makeApi())
    useOrganization('')
    expect(mockUseQuery).toHaveBeenCalledWith(expect.objectContaining({
      enabled: false,
    }))
  })
})

describe('useCreateOrganization', () => {
  beforeEach(() => vi.clearAllMocks())

  it('posts to the org create endpoint', async () => {
    const api = makeApi()
    ;(api.post as ReturnType<typeof vi.fn>).mockResolvedValue({ id: 'org-new', name: 'ACME' })
    mockUseMutation.mockImplementation((opts: any) => ({ _opts: opts }))
    const { useCreateOrganization } = createOrgHooks(api)
    const { _opts } = useCreateOrganization() as any
    await _opts.mutationFn({ name: 'ACME' })
    expect(api.post).toHaveBeenCalledWith(expect.stringMatching(/\/orgs/), { name: 'ACME' })
  })
})

describe('useOrgMembers', () => {
  beforeEach(() => vi.clearAllMocks())

  it('queries with org members key', () => {
    mockUseQuery.mockReturnValue({ data: undefined, isLoading: false })
    const { useOrgMembers } = createOrgHooks(makeApi())
    useOrgMembers('org-123')
    expect(mockUseQuery).toHaveBeenCalledWith(expect.objectContaining({
      queryKey: ['orgs', 'org-123', 'members'],
    }))
  })
})
