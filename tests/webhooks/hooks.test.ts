import { beforeEach, describe, expect, it, vi } from 'vitest'

vi.mock('@tanstack/react-query', () => ({
  useQuery: vi.fn(),
  useMutation: vi.fn((options: unknown) => ({ _opts: options })),
  useQueryClient: vi.fn(() => ({ invalidateQueries: vi.fn() })),
}))

import { useQuery } from '@tanstack/react-query'
import type { ApiClient } from '../../src/api/client'
import { createWebhookHooks } from '../../src/webhooks/hooks'

const mockUseQuery = useQuery as ReturnType<typeof vi.fn>

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

describe('useWebhookDeliveries', () => {
  beforeEach(() => vi.clearAllMocks())

  it('uses the Slingshot cursor contract in the URL and query key', () => {
    const api = makeApi()
    mockUseQuery.mockReturnValue({ data: undefined, isLoading: false })
    const { useWebhookDeliveries } = createWebhookHooks(api)

    useWebhookDeliveries({
      endpointId: 'endpoint-1',
      limit: 25,
      cursor: 'delivery/cursor',
      sortDir: 'asc',
    })

    const options = mockUseQuery.mock.calls[0]![0] as { queryFn: () => void }
    options.queryFn()
    expect(api.get).toHaveBeenCalledWith(
      '/webhooks/endpoints/endpoint-1/deliveries?limit=25&cursor=delivery%2Fcursor&sortDir=asc',
    )
    expect(mockUseQuery).toHaveBeenCalledWith(
      expect.objectContaining({
        queryKey: [
          'webhooks',
          'deliveries',
          'endpoint-1',
          { limit: 25, cursor: 'delivery/cursor', sortDir: 'asc' },
        ],
      }),
    )
  })

  it('does not add legacy page parameters or an empty query string', () => {
    const api = makeApi()
    mockUseQuery.mockReturnValue({ data: undefined, isLoading: false })
    const { useWebhookDeliveries } = createWebhookHooks(api)

    useWebhookDeliveries({ endpointId: 'endpoint-1' })

    const options = mockUseQuery.mock.calls[0]![0] as { queryFn: () => void }
    options.queryFn()
    expect(api.get).toHaveBeenCalledWith('/webhooks/endpoints/endpoint-1/deliveries')
  })
})
