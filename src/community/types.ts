// ── Container ──────────────────────────────────────────────────────────────────

export interface ContainerResponse {
  id: string
  slug: string
  name: string
  description?: string
  isPrivate: boolean
  isClosed: boolean
  createdAt: string
  updatedAt: string
}

export interface CreateContainerBody {
  slug: string
  name: string
  description?: string
  isPrivate?: boolean
}

export interface UpdateContainerBody {
  name?: string
  description?: string
  isPrivate?: boolean
  isClosed?: boolean
}

// ── Thread ─────────────────────────────────────────────────────────────────────

export interface ThreadResponse {
  id: string
  containerId: string
  authorId: string
  title: string
  body: string
  isPinned: boolean
  isLocked: boolean
  replyCount: number
  reactionCount: number
  createdAt: string
  updatedAt: string
}

export interface CreateThreadBody {
  title: string
  body: string
}

export interface UpdateThreadBody {
  title?: string
  body?: string
  isPinned?: boolean
  isLocked?: boolean
}

// ── Reply ──────────────────────────────────────────────────────────────────────

export interface ReplyResponse {
  id: string
  threadId: string
  authorId: string
  body: string
  reactionCount: number
  createdAt: string
  updatedAt: string
}

export interface CreateReplyBody {
  body: string
}

export interface UpdateReplyBody {
  body: string
}

// ── Reactions ──────────────────────────────────────────────────────────────────

export interface ReactionBody {
  emoji: string
}

// ── Reports ───────────────────────────────────────────────────────────────────

export interface ReportBody {
  reason: string
  targetType: string
  targetId: string
}

export interface ReportResponse {
  id: string
  targetType: string
  targetId: string
  reporterId: string
  reason: string
  status: string
  createdAt: string
  updatedAt: string
}

export interface ResolveReportBody {
  action: string
}

// ── Bans ──────────────────────────────────────────────────────────────────────

export interface BanBody {
  userId: string
  containerId?: string
  reason?: string
  expiresAt?: string
}

export interface BanResponse {
  id: string
  userId: string
  containerId?: string
  reason?: string
  expiresAt?: string
  createdAt: string
}

export interface BanCheckResponse {
  banned: boolean
  ban?: BanResponse
}

// ── Notifications ─────────────────────────────────────────────────────────────

export interface NotificationResponse {
  id: string
  userId: string
  type: string
  payload: unknown
  read: boolean
  createdAt: string
}

// ── Pagination / Search ────────────────────────────────────────────────────────

export interface PaginatedResponse<T> {
  items: T[]
  cursor?: string
  nextCursor?: string
  hasMore?: boolean
}

export interface CommunitySearchParams extends ListParams {
  q: string
  type?: 'threads' | 'replies'
  containerId?: string
}

export interface SearchResponse {
  threads?: PaginatedResponse<ThreadResponse>
  replies?: PaginatedResponse<ReplyResponse>
}

// ── Param types ───────────────────────────────────────────────────────────────

export interface ListParams {
  limit?: number
  cursor?: string
  sortDir?: 'asc' | 'desc'
}

export interface ThreadListParams extends ListParams {
  containerId: string
}

export interface ReplyListParams extends ListParams {
  threadId: string
}
