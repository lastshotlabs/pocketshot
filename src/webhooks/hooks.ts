import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import type { ApiClient } from '../api/client'
import { listQuery } from '../api/list-query'
import type {
  WebhookEndpointResponse,
  CreateWebhookEndpointBody,
  UpdateWebhookEndpointBody,
  WebhookDeliveryResponse,
  WebhookDeliveryListParams,
  TestWebhookBody,
} from './types'
import type { PaginatedResponse } from '../community/types'

// ── Cache key helpers ──────────────────────────────────────────────────────────

const keys = {
  endpoints: () => ['webhooks', 'endpoints'] as const,
  endpoint: (endpointId: string) => ['webhooks', 'endpoints', endpointId] as const,
  deliveries: (endpointId: string) => ['webhooks', 'deliveries', endpointId] as const,
  deliveryDetail: (deliveryId: string) => ['webhooks', 'deliveries', 'detail', deliveryId] as const,
}

// ── Factory ───────────────────────────────────────────────────────────────────

export function createWebhookHooks(api: ApiClient) {
  // ── Endpoints ─────────────────────────────────────────────────────────────────

  function useWebhookEndpoints() {
    return useQuery<WebhookEndpointResponse[]>({
      queryKey: keys.endpoints(),
      queryFn: () => api.get<WebhookEndpointResponse[]>('/webhooks/endpoints'),
    })
  }

  function useWebhookEndpoint(endpointId: string) {
    return useQuery<WebhookEndpointResponse>({
      queryKey: keys.endpoint(endpointId),
      queryFn: () => api.get<WebhookEndpointResponse>(`/webhooks/endpoints/${endpointId}`),
      enabled: !!endpointId,
    })
  }

  function useCreateWebhookEndpoint() {
    const queryClient = useQueryClient()
    return useMutation<WebhookEndpointResponse, Error, CreateWebhookEndpointBody>({
      mutationFn: (body) => api.post<WebhookEndpointResponse>('/webhooks/endpoints', body),
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: keys.endpoints() })
      },
    })
  }

  function useUpdateWebhookEndpoint() {
    const queryClient = useQueryClient()
    return useMutation<
      WebhookEndpointResponse,
      Error,
      { endpointId: string } & UpdateWebhookEndpointBody
    >({
      mutationFn: ({ endpointId, ...body }) =>
        api.patch<WebhookEndpointResponse>(`/webhooks/endpoints/${endpointId}`, body),
      onSuccess: (_data, { endpointId }) => {
        queryClient.invalidateQueries({ queryKey: keys.endpoints() })
        queryClient.invalidateQueries({ queryKey: keys.endpoint(endpointId) })
      },
    })
  }

  function useDeleteWebhookEndpoint() {
    const queryClient = useQueryClient()
    return useMutation<void, Error, { endpointId: string }>({
      mutationFn: ({ endpointId }) => api.delete<void>(`/webhooks/endpoints/${endpointId}`),
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: keys.endpoints() })
      },
    })
  }

  // ── Deliveries ────────────────────────────────────────────────────────────────

  function useWebhookDeliveries({ endpointId, ...params }: WebhookDeliveryListParams) {
    const query = listQuery(params)
    return useQuery<PaginatedResponse<WebhookDeliveryResponse>>({
      queryKey: [...keys.deliveries(endpointId), params],
      queryFn: () =>
        api.get<PaginatedResponse<WebhookDeliveryResponse>>(
          `/webhooks/endpoints/${endpointId}/deliveries${query}`,
        ),
      enabled: !!endpointId,
    })
  }

  function useWebhookDelivery(deliveryId: string) {
    return useQuery<WebhookDeliveryResponse>({
      queryKey: keys.deliveryDetail(deliveryId),
      queryFn: () => api.get<WebhookDeliveryResponse>(`/webhooks/deliveries/${deliveryId}`),
      enabled: !!deliveryId,
    })
  }

  // ── Test ──────────────────────────────────────────────────────────────────────

  function useTestWebhookEndpoint() {
    const queryClient = useQueryClient()
    return useMutation<void, Error, { endpointId: string } & TestWebhookBody>({
      mutationFn: ({ endpointId, ...body }) =>
        api.post<void>(`/webhooks/endpoints/${endpointId}/test`, body),
      onSuccess: (_data, { endpointId }) => {
        queryClient.invalidateQueries({ queryKey: keys.deliveries(endpointId) })
      },
    })
  }

  // ── Return all hooks ──────────────────────────────────────────────────────────

  return {
    useWebhookEndpoints,
    useWebhookEndpoint,
    useCreateWebhookEndpoint,
    useUpdateWebhookEndpoint,
    useDeleteWebhookEndpoint,
    useWebhookDeliveries,
    useWebhookDelivery,
    useTestWebhookEndpoint,
  }
}

export type WebhookHooks = ReturnType<typeof createWebhookHooks>
