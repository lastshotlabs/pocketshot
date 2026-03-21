// ── Webhook Endpoints ─────────────────────────────────────────────────────────

export interface WebhookEndpointResponse {
  id: string
  url: string
  events: string[]
  secretHint: string
  isActive: boolean
  createdAt: string
  updatedAt: string
}

export interface CreateWebhookEndpointBody {
  url: string
  events: string[]
}

export interface UpdateWebhookEndpointBody {
  url?: string
  events?: string[]
  isActive?: boolean
}

// ── Webhook Deliveries ────────────────────────────────────────────────────────

export interface WebhookDeliveryResponse {
  id: string
  endpointId: string
  event: string
  payload: unknown
  status: string
  attempts: number
  maxAttempts: number
  lastAttemptAt?: string
  createdAt: string
}

// ── Param types ───────────────────────────────────────────────────────────────

export interface WebhookEndpointParams {
  endpointId: string
}

export interface WebhookDeliveryListParams {
  endpointId: string
  page?: number
  pageSize?: number
}

// ── Test ──────────────────────────────────────────────────────────────────────

export interface TestWebhookBody {
  event: string
}
