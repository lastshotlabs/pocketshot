import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import type { ApiClient } from '../api/client'
import type {
  ContainerResponse,
  CreateContainerBody,
  UpdateContainerBody,
  ThreadResponse,
  CreateThreadBody,
  UpdateThreadBody,
  ReplyResponse,
  CreateReplyBody,
  UpdateReplyBody,
  ReactionBody,
  ReportBody,
  ReportResponse,
  ResolveReportBody,
  BanBody,
  BanResponse,
  BanCheckResponse,
  PaginatedResponse,
  SearchResponse,
  NotificationResponse,
  ListParams,
  ThreadListParams,
  ReplyListParams,
  CommunitySearchParams,
} from './types'

// ── Cache key helpers ──────────────────────────────────────────────────────────

const keys = {
  containers: () => ['community', 'containers'] as const,
  container: (containerId: string) => ['community', 'containers', containerId] as const,
  threads: (containerId: string) => ['community', 'threads', containerId] as const,
  threadDetail: (threadId: string) => ['community', 'threads', 'detail', threadId] as const,
  replies: (threadId: string) => ['community', 'replies', threadId] as const,
  replyDetail: (replyId: string) => ['community', 'replies', 'detail', replyId] as const,
  reports: () => ['community', 'reports'] as const,
  bans: () => ['community', 'bans'] as const,
  banCheck: (userId: string, containerId?: string) =>
    ['community', 'bans', userId, 'check', containerId ?? null] as const,
  banCheckPrefix: (userId: string) => ['community', 'bans', userId, 'check'] as const,
  notifications: () => ['community', 'notifications'] as const,
  search: () => ['community', 'search'] as const,
  searchReplies: () => ['community', 'search', 'replies'] as const,
}

// ── Factory ───────────────────────────────────────────────────────────────────

export function createCommunityHooks(api: ApiClient) {

  // ── Containers ───────────────────────────────────────────────────────────────

  function useListContainers(params?: ListParams) {
    const query = params ? `?page=${params.page ?? 1}&pageSize=${params.pageSize ?? 20}` : ''
    return useQuery<PaginatedResponse<ContainerResponse>>({
      queryKey: keys.containers(),
      queryFn: () => api.get<PaginatedResponse<ContainerResponse>>(`/community/containers${query}`),
    })
  }

  function useGetContainer(containerId: string) {
    return useQuery<ContainerResponse>({
      queryKey: keys.container(containerId),
      queryFn: () => api.get<ContainerResponse>(`/community/containers/${containerId}`),
      enabled: !!containerId,
    })
  }

  function useCreateContainer() {
    const queryClient = useQueryClient()
    return useMutation<ContainerResponse, Error, CreateContainerBody>({
      mutationFn: (body) => api.post<ContainerResponse>('/community/containers', body),
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: keys.containers() })
      },
    })
  }

  function useUpdateContainer() {
    const queryClient = useQueryClient()
    return useMutation<ContainerResponse, Error, { containerId: string } & UpdateContainerBody>({
      mutationFn: ({ containerId, ...body }) =>
        api.patch<ContainerResponse>(`/community/containers/${containerId}`, body),
      onSuccess: (_data, { containerId }) => {
        queryClient.invalidateQueries({ queryKey: keys.containers() })
        queryClient.invalidateQueries({ queryKey: keys.container(containerId) })
      },
    })
  }

  function useDeleteContainer() {
    const queryClient = useQueryClient()
    return useMutation<void, Error, { containerId: string }>({
      mutationFn: ({ containerId }) => api.delete<void>(`/community/containers/${containerId}`),
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: keys.containers() })
      },
    })
  }

  // ── Threads ───────────────────────────────────────────────────────────────────

  function useListThreads({ containerId, ...params }: ThreadListParams) {
    const query = `?page=${params.page ?? 1}&pageSize=${params.pageSize ?? 20}`
    return useQuery<PaginatedResponse<ThreadResponse>>({
      queryKey: keys.threads(containerId),
      queryFn: () =>
        api.get<PaginatedResponse<ThreadResponse>>(
          `/community/containers/${containerId}/threads${query}`,
        ),
      enabled: !!containerId,
    })
  }

  function useGetThread(threadId: string) {
    return useQuery<ThreadResponse>({
      queryKey: keys.threadDetail(threadId),
      queryFn: () => api.get<ThreadResponse>(`/community/threads/${threadId}`),
      enabled: !!threadId,
    })
  }

  function useCreateThread() {
    const queryClient = useQueryClient()
    return useMutation<ThreadResponse, Error, { containerId: string } & CreateThreadBody>({
      mutationFn: ({ containerId, ...body }) =>
        api.post<ThreadResponse>(`/community/containers/${containerId}/threads`, body),
      onSuccess: (_data, { containerId }) => {
        queryClient.invalidateQueries({ queryKey: keys.threads(containerId) })
        queryClient.invalidateQueries({ queryKey: keys.search() })
      },
    })
  }

  function useUpdateThread() {
    const queryClient = useQueryClient()
    return useMutation<ThreadResponse, Error, { threadId: string; containerId: string } & UpdateThreadBody>({
      mutationFn: ({ threadId, containerId: _cid, ...body }) =>
        api.patch<ThreadResponse>(`/community/threads/${threadId}`, body),
      onSuccess: (_data, { threadId, containerId }) => {
        queryClient.invalidateQueries({ queryKey: keys.threadDetail(threadId) })
        queryClient.invalidateQueries({ queryKey: keys.threads(containerId) })
        queryClient.invalidateQueries({ queryKey: keys.search() })
      },
    })
  }

  function useDeleteThread() {
    const queryClient = useQueryClient()
    return useMutation<void, Error, { threadId: string; containerId: string }>({
      mutationFn: ({ threadId }) => api.delete<void>(`/community/threads/${threadId}`),
      onSuccess: (_data, { containerId }) => {
        queryClient.invalidateQueries({ queryKey: keys.threads(containerId) })
        queryClient.invalidateQueries({ queryKey: keys.search() })
      },
    })
  }

  // ── Replies ───────────────────────────────────────────────────────────────────

  function useListReplies({ threadId, ...params }: ReplyListParams) {
    const query = `?page=${params.page ?? 1}&pageSize=${params.pageSize ?? 20}`
    return useQuery<PaginatedResponse<ReplyResponse>>({
      queryKey: keys.replies(threadId),
      queryFn: () =>
        api.get<PaginatedResponse<ReplyResponse>>(
          `/community/threads/${threadId}/replies${query}`,
        ),
      enabled: !!threadId,
    })
  }

  function useGetReply(replyId: string) {
    return useQuery<ReplyResponse>({
      queryKey: keys.replyDetail(replyId),
      queryFn: () => api.get<ReplyResponse>(`/community/replies/${replyId}`),
      enabled: !!replyId,
    })
  }

  function useCreateReply() {
    const queryClient = useQueryClient()
    return useMutation<ReplyResponse, Error, { threadId: string } & CreateReplyBody>({
      mutationFn: ({ threadId, ...body }) =>
        api.post<ReplyResponse>(`/community/threads/${threadId}/replies`, body),
      onSuccess: (_data, { threadId }) => {
        queryClient.invalidateQueries({ queryKey: keys.replies(threadId) })
        queryClient.invalidateQueries({ queryKey: keys.search() })
      },
    })
  }

  function useUpdateReply() {
    const queryClient = useQueryClient()
    return useMutation<ReplyResponse, Error, { replyId: string; threadId: string } & UpdateReplyBody>({
      mutationFn: ({ replyId, threadId: _tid, ...body }) =>
        api.patch<ReplyResponse>(`/community/replies/${replyId}`, body),
      onSuccess: (_data, { replyId, threadId }) => {
        queryClient.invalidateQueries({ queryKey: keys.replyDetail(replyId) })
        queryClient.invalidateQueries({ queryKey: keys.replies(threadId) })
        queryClient.invalidateQueries({ queryKey: keys.search() })
      },
    })
  }

  function useDeleteReply() {
    const queryClient = useQueryClient()
    return useMutation<void, Error, { replyId: string; threadId: string }>({
      mutationFn: ({ replyId }) => api.delete<void>(`/community/replies/${replyId}`),
      onSuccess: (_data, { threadId }) => {
        queryClient.invalidateQueries({ queryKey: keys.replies(threadId) })
        queryClient.invalidateQueries({ queryKey: keys.search() })
      },
    })
  }

  // ── Thread Reactions ──────────────────────────────────────────────────────────

  function useAddThreadReaction() {
    const queryClient = useQueryClient()
    return useMutation<void, Error, { threadId: string; containerId: string } & ReactionBody>({
      mutationFn: ({ threadId, containerId: _cid, ...body }) =>
        api.post<void>(`/community/threads/${threadId}/reactions`, body),
      onSuccess: (_data, { threadId, containerId }) => {
        queryClient.invalidateQueries({ queryKey: keys.threadDetail(threadId) })
        queryClient.invalidateQueries({ queryKey: keys.threads(containerId) })
      },
    })
  }

  function useRemoveThreadReaction() {
    const queryClient = useQueryClient()
    return useMutation<void, Error, { threadId: string; containerId: string; emoji: string }>({
      mutationFn: ({ threadId, emoji }) =>
        api.delete<void>(`/community/threads/${threadId}/reactions/${encodeURIComponent(emoji)}`),
      onSuccess: (_data, { threadId, containerId }) => {
        queryClient.invalidateQueries({ queryKey: keys.threadDetail(threadId) })
        queryClient.invalidateQueries({ queryKey: keys.threads(containerId) })
      },
    })
  }

  // ── Reply Reactions ───────────────────────────────────────────────────────────

  function useAddReplyReaction() {
    const queryClient = useQueryClient()
    return useMutation<void, Error, { replyId: string; threadId: string } & ReactionBody>({
      mutationFn: ({ replyId, threadId: _tid, ...body }) =>
        api.post<void>(`/community/replies/${replyId}/reactions`, body),
      onSuccess: (_data, { replyId, threadId }) => {
        queryClient.invalidateQueries({ queryKey: keys.replyDetail(replyId) })
        queryClient.invalidateQueries({ queryKey: keys.replies(threadId) })
        queryClient.invalidateQueries({ queryKey: keys.searchReplies() })
      },
    })
  }

  function useRemoveReplyReaction() {
    const queryClient = useQueryClient()
    return useMutation<void, Error, { replyId: string; threadId: string; emoji: string }>({
      mutationFn: ({ replyId, emoji }) =>
        api.delete<void>(`/community/replies/${replyId}/reactions/${encodeURIComponent(emoji)}`),
      onSuccess: (_data, { replyId, threadId }) => {
        queryClient.invalidateQueries({ queryKey: keys.replyDetail(replyId) })
        queryClient.invalidateQueries({ queryKey: keys.replies(threadId) })
        queryClient.invalidateQueries({ queryKey: keys.searchReplies() })
      },
    })
  }

  // ── Reports ───────────────────────────────────────────────────────────────────

  function useListReports(params?: ListParams) {
    const query = params ? `?page=${params.page ?? 1}&pageSize=${params.pageSize ?? 20}` : ''
    return useQuery<PaginatedResponse<ReportResponse>>({
      queryKey: keys.reports(),
      queryFn: () =>
        api.get<PaginatedResponse<ReportResponse>>(`/community/reports${query}`),
    })
  }

  function useCreateReport() {
    const queryClient = useQueryClient()
    return useMutation<ReportResponse, Error, ReportBody>({
      mutationFn: (body) => api.post<ReportResponse>('/community/reports', body),
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: keys.reports() })
      },
    })
  }

  function useResolveReport() {
    const queryClient = useQueryClient()
    return useMutation<ReportResponse, Error, { reportId: string } & ResolveReportBody>({
      mutationFn: ({ reportId, ...body }) =>
        api.post<ReportResponse>(`/community/reports/${reportId}/resolve`, body),
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: keys.reports() })
      },
    })
  }

  // ── Bans ──────────────────────────────────────────────────────────────────────

  function useListBans(params?: ListParams) {
    const query = params ? `?page=${params.page ?? 1}&pageSize=${params.pageSize ?? 20}` : ''
    return useQuery<PaginatedResponse<BanResponse>>({
      queryKey: keys.bans(),
      queryFn: () =>
        api.get<PaginatedResponse<BanResponse>>(`/community/bans${query}`),
    })
  }

  function useCheckBan(userId: string, containerId?: string) {
    const params = containerId
      ? `?userId=${userId}&containerId=${containerId}`
      : `?userId=${userId}`
    return useQuery<BanCheckResponse>({
      queryKey: keys.banCheck(userId, containerId),
      queryFn: () => api.get<BanCheckResponse>(`/community/bans/check${params}`),
      enabled: !!userId,
    })
  }

  function useCreateBan() {
    const queryClient = useQueryClient()
    return useMutation<BanResponse, Error, BanBody>({
      mutationFn: (body) => api.post<BanResponse>('/community/bans', body),
      onSuccess: (_data, { userId }) => {
        queryClient.invalidateQueries({ queryKey: keys.bans() })
        queryClient.invalidateQueries({ queryKey: keys.banCheckPrefix(userId) })
      },
    })
  }

  function useDeleteBan() {
    const queryClient = useQueryClient()
    return useMutation<void, Error, { banId: string; userId: string }>({
      mutationFn: ({ banId }) => api.delete<void>(`/community/bans/${banId}`),
      onSuccess: (_data, { userId }) => {
        queryClient.invalidateQueries({ queryKey: keys.bans() })
        queryClient.invalidateQueries({ queryKey: keys.banCheckPrefix(userId) })
      },
    })
  }

  // ── Notifications ─────────────────────────────────────────────────────────────

  function useListNotifications(params?: ListParams) {
    const query = params ? `?page=${params.page ?? 1}&pageSize=${params.pageSize ?? 20}` : ''
    return useQuery<PaginatedResponse<NotificationResponse>>({
      queryKey: keys.notifications(),
      queryFn: () =>
        api.get<PaginatedResponse<NotificationResponse>>(`/community/notifications${query}`),
    })
  }

  function useMarkNotificationRead() {
    const queryClient = useQueryClient()
    return useMutation<void, Error, { notificationId: string }>({
      mutationFn: ({ notificationId }) =>
        api.patch<void>(`/community/notifications/${notificationId}/read`, {}),
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: keys.notifications() })
      },
    })
  }

  function useMarkAllNotificationsRead() {
    const queryClient = useQueryClient()
    return useMutation<void, Error, void>({
      mutationFn: () => api.post<void>('/community/notifications/read-all', {}),
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: keys.notifications() })
      },
    })
  }

  // ── Search ────────────────────────────────────────────────────────────────────

  function useSearch(params: CommunitySearchParams) {
    const qs = new URLSearchParams({ q: params.q })
    if (params.type) qs.set('type', params.type)
    if (params.containerId) qs.set('containerId', params.containerId)
    if (params.page) qs.set('page', String(params.page))
    if (params.pageSize) qs.set('pageSize', String(params.pageSize))
    return useQuery<SearchResponse>({
      queryKey: [...keys.search(), params] as const,
      queryFn: () => api.get<SearchResponse>(`/community/search?${qs.toString()}`),
      enabled: !!params.q,
    })
  }

  // ── Return all hooks ──────────────────────────────────────────────────────────

  return {
    // Containers
    useListContainers,
    useGetContainer,
    useCreateContainer,
    useUpdateContainer,
    useDeleteContainer,
    // Threads
    useListThreads,
    useGetThread,
    useCreateThread,
    useUpdateThread,
    useDeleteThread,
    // Replies
    useListReplies,
    useGetReply,
    useCreateReply,
    useUpdateReply,
    useDeleteReply,
    // Thread reactions
    useAddThreadReaction,
    useRemoveThreadReaction,
    // Reply reactions
    useAddReplyReaction,
    useRemoveReplyReaction,
    // Reports
    useListReports,
    useCreateReport,
    useResolveReport,
    // Bans
    useListBans,
    useCheckBan,
    useCreateBan,
    useDeleteBan,
    // Notifications
    useListNotifications,
    useMarkNotificationRead,
    useMarkAllNotificationsRead,
    // Search
    useSearch,
  }
}

export type CommunityHooks = ReturnType<typeof createCommunityHooks>
