import { describe, it, expect, vi, beforeEach } from 'vitest'

vi.mock('@tanstack/react-query', () => ({
  useQuery: vi.fn(),
  useMutation: vi.fn((opts: any) => ({ _opts: opts })),
  useQueryClient: vi.fn(() => ({ invalidateQueries: vi.fn() })),
}))

import { useQuery, useMutation } from '@tanstack/react-query'
import { createCommunityHooks } from '../../src/community/hooks'
import type { ApiClient } from '../../src/api/client'

const mockUseQuery = useQuery as ReturnType<typeof vi.fn>
const mockUseMutation = useMutation as ReturnType<typeof vi.fn>

function makeApi(): ApiClient {
  return {
    get: vi.fn(),
    post: vi.fn(),
    put: vi.fn(),
    patch: vi.fn(),
    delete: vi.fn(),
    fetch: vi.fn(),
  } as unknown as ApiClient
}

describe('createCommunityHooks factory shape', () => {
  it('returns all container hooks', () => {
    const hooks = createCommunityHooks(makeApi())
    expect(typeof hooks.useContainers).toBe('function')
    expect(typeof hooks.useContainer).toBe('function')
    expect(typeof hooks.useCreateContainer).toBe('function')
    expect(typeof hooks.useUpdateContainer).toBe('function')
    expect(typeof hooks.useDeleteContainer).toBe('function')
  })

  it('returns all thread hooks', () => {
    const hooks = createCommunityHooks(makeApi())
    expect(typeof hooks.useContainerThreads).toBe('function')
    expect(typeof hooks.useContainerThread).toBe('function')
    expect(typeof hooks.useCreateThread).toBe('function')
    expect(typeof hooks.useUpdateThread).toBe('function')
    expect(typeof hooks.useDeleteThread).toBe('function')
    expect(typeof hooks.usePublishThread).toBe('function')
    expect(typeof hooks.useLockThread).toBe('function')
    expect(typeof hooks.usePinThread).toBe('function')
    expect(typeof hooks.useUnpinThread).toBe('function')
  })

  it('returns all reply hooks', () => {
    const hooks = createCommunityHooks(makeApi())
    expect(typeof hooks.useThreadReplies).toBe('function')
    expect(typeof hooks.useReply).toBe('function')
    expect(typeof hooks.useCreateReply).toBe('function')
    expect(typeof hooks.useUpdateReply).toBe('function')
    expect(typeof hooks.useDeleteReply).toBe('function')
  })

  it('returns moderation hooks', () => {
    const hooks = createCommunityHooks(makeApi())
    expect(typeof hooks.useReports).toBe('function')
    expect(typeof hooks.useCreateReport).toBe('function')
    expect(typeof hooks.useResolveReport).toBe('function')
    expect(typeof hooks.useBans).toBe('function')
    expect(typeof hooks.useCheckBan).toBe('function')
    expect(typeof hooks.useCreateBan).toBe('function')
    expect(typeof hooks.useRemoveBan).toBe('function')
  })

  it('returns notification hooks', () => {
    const hooks = createCommunityHooks(makeApi())
    expect(typeof hooks.useNotifications).toBe('function')
    expect(typeof hooks.useNotificationsUnreadCount).toBe('function')
    expect(typeof hooks.useMarkNotificationRead).toBe('function')
    expect(typeof hooks.useMarkAllNotificationsRead).toBe('function')
  })

  it('returns search hooks', () => {
    const hooks = createCommunityHooks(makeApi())
    expect(typeof hooks.useSearchThreads).toBe('function')
    expect(typeof hooks.useSearchReplies).toBe('function')
  })
})

describe('useContainers', () => {
  beforeEach(() => vi.clearAllMocks())

  it('queries with the containers query key', () => {
    mockUseQuery.mockReturnValue({ data: undefined, isLoading: false })
    const { useContainers } = createCommunityHooks(makeApi())
    useContainers()
    expect(mockUseQuery).toHaveBeenCalledWith(
      expect.objectContaining({
        queryKey: ['community', 'containers'],
      }),
    )
  })

  it('calls api.get with the containers endpoint', () => {
    const api = makeApi()
    mockUseQuery.mockReturnValue({ data: undefined, isLoading: false })
    const { useContainers } = createCommunityHooks(api)
    useContainers()
    const opts = mockUseQuery.mock.calls[0]![0] as { queryFn: () => void }
    opts.queryFn()
    expect(api.get).toHaveBeenCalledWith(expect.stringContaining('/community/containers'))
  })

  it('appends pagination params', () => {
    const api = makeApi()
    mockUseQuery.mockReturnValue({ data: undefined, isLoading: false })
    const { useContainers } = createCommunityHooks(api)
    useContainers({ page: 2, pageSize: 10 })
    const opts = mockUseQuery.mock.calls[0]![0] as { queryFn: () => void }
    opts.queryFn()
    const url = (api.get as ReturnType<typeof vi.fn>).mock.calls[0][0] as string
    expect(url).toContain('page=2')
    expect(url).toContain('pageSize=10')
  })
})

describe('useContainer', () => {
  beforeEach(() => vi.clearAllMocks())

  it('uses container-specific query key', () => {
    mockUseQuery.mockReturnValue({ data: undefined, isLoading: false })
    const { useContainer } = createCommunityHooks(makeApi())
    useContainer('container-123')
    expect(mockUseQuery).toHaveBeenCalledWith(
      expect.objectContaining({
        queryKey: ['community', 'containers', 'container-123'],
        enabled: true,
      }),
    )
  })

  it('is disabled when containerId is empty', () => {
    mockUseQuery.mockReturnValue({ data: undefined, isLoading: false })
    const { useContainer } = createCommunityHooks(makeApi())
    useContainer('')
    expect(mockUseQuery).toHaveBeenCalledWith(expect.objectContaining({ enabled: false }))
  })
})

describe('useCreateContainer mutation', () => {
  beforeEach(() => vi.clearAllMocks())

  it('posts to the containers endpoint', async () => {
    const api = makeApi()
    ;(api.post as ReturnType<typeof vi.fn>).mockResolvedValue({ id: 'c-1', slug: 'general' })
    mockUseMutation.mockImplementation((opts: any) => ({ _opts: opts }))
    const { useCreateContainer } = createCommunityHooks(api)
    const { _opts } = useCreateContainer() as any
    await _opts.mutationFn({ slug: 'general', name: 'General', isPrivate: false })
    expect(api.post).toHaveBeenCalledWith(
      '/community/containers',
      expect.objectContaining({ slug: 'general' }),
    )
  })
})

describe('useCreateThread mutation', () => {
  beforeEach(() => vi.clearAllMocks())

  it('posts to the container threads endpoint', async () => {
    const api = makeApi()
    ;(api.post as ReturnType<typeof vi.fn>).mockResolvedValue({ id: 't-1', title: 'Hello' })
    mockUseMutation.mockImplementation((opts: any) => ({ _opts: opts }))
    const { useCreateThread } = createCommunityHooks(api)
    const { _opts } = useCreateThread() as any
    await _opts.mutationFn({ containerId: 'c-1', title: 'Hello', body: 'World' })
    expect(api.post).toHaveBeenCalledWith(
      '/community/containers/c-1/threads',
      expect.objectContaining({ title: 'Hello' }),
    )
  })
})

describe('useCheckBan', () => {
  beforeEach(() => vi.clearAllMocks())

  it('uses ban check query key with userId and containerId', () => {
    mockUseQuery.mockReturnValue({ data: undefined, isLoading: false })
    const { useCheckBan } = createCommunityHooks(makeApi())
    useCheckBan('user-123', 'container-abc')
    expect(mockUseQuery).toHaveBeenCalledWith(
      expect.objectContaining({
        queryKey: ['community', 'bans', 'user-123', 'check', 'container-abc'],
      }),
    )
  })

  it('uses null containerId when not provided', () => {
    mockUseQuery.mockReturnValue({ data: undefined, isLoading: false })
    const { useCheckBan } = createCommunityHooks(makeApi())
    useCheckBan('user-123')
    expect(mockUseQuery).toHaveBeenCalledWith(
      expect.objectContaining({
        queryKey: ['community', 'bans', 'user-123', 'check', null],
      }),
    )
  })
})
