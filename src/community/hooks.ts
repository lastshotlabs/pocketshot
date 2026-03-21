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
  report: (reportId: string) => ['community', 'reports', reportId] as const,
  bans: () => ['community', 'bans'] as const,
  banCheck: (userId: string, containerId?: string) =>
    ['community', 'bans', userId, 'check', containerId ?? null] as const,
  banCheckPrefix: (userId: string) => ['community', 'bans', userId, 'check'] as const,
  notifications: () => ['community', 'notifications'] as const,
  notificationsUnread: () => ['community', 'notifications', 'unread'] as const,
  members: (containerId: string) => ['community', 'members', containerId] as const,
  moderators: (containerId: string) => ['community', 'moderators', containerId] as const,
  owners: (containerId: string) => ['community', 'owners', containerId] as const,
  searchThreads: () => ['community', 'search', 'threads'] as const,
  searchReplies: () => ['community', 'search', 'replies'] as const,
}

// ── Factory ───────────────────────────────────────────────────────────────────

export function createCommunityHooks(api: ApiClient) {

  // ── Containers ───────────────────────────────────────────────────────────────

  function useContainers(params?: ListParams) {
    const query = params ? `?page=${params.page ?? 1}&pageSize=${params.pageSize ?? 20}` : ''
    return useQuery<PaginatedResponse<ContainerResponse>>({
      queryKey: keys.containers(),
      queryFn: () => api.get<PaginatedResponse<ContainerResponse>>(`/community/containers${query}`),
    })
  }

  function useContainer(containerId: string) {
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

  function useContainerThreads({ containerId, ...params }: ThreadListParams) {
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

  function useContainerThread(threadId: string) {
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
        queryClient.invalidateQueries({ queryKey: keys.searchThreads() })
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
        queryClient.invalidateQueries({ queryKey: keys.searchThreads() })
      },
    })
  }

  function useDeleteThread() {
    const queryClient = useQueryClient()
    return useMutation<void, Error, { threadId: string; containerId: string }>({
      mutationFn: ({ threadId }) => api.delete<void>(`/community/threads/${threadId}`),
      onSuccess: (_data, { containerId }) => {
        queryClient.invalidateQueries({ queryKey: keys.threads(containerId) })
        queryClient.invalidateQueries({ queryKey: keys.searchThreads() })
      },
    })
  }

  function usePublishThread() {
    const queryClient = useQueryClient()
    return useMutation<ThreadResponse, Error, { threadId: string; containerId: string }>({
      mutationFn: ({ threadId }) =>
        api.post<ThreadResponse>(`/community/threads/${threadId}/publish`, {}),
      onSuccess: (_data, { threadId, containerId }) => {
        queryClient.invalidateQueries({ queryKey: keys.threadDetail(threadId) })
        queryClient.invalidateQueries({ queryKey: keys.threads(containerId) })
      },
    })
  }

  function useLockThread() {
    const queryClient = useQueryClient()
    return useMutation<ThreadResponse, Error, { threadId: string; containerId: string }>({
      mutationFn: ({ threadId }) =>
        api.post<ThreadResponse>(`/community/threads/${threadId}/lock`, {}),
      onSuccess: (_data, { threadId, containerId }) => {
        queryClient.invalidateQueries({ queryKey: keys.threadDetail(threadId) })
        queryClient.invalidateQueries({ queryKey: keys.threads(containerId) })
      },
    })
  }

  function usePinThread() {
    const queryClient = useQueryClient()
    return useMutation<ThreadResponse, Error, { threadId: string; containerId: string }>({
      mutationFn: ({ threadId }) =>
        api.post<ThreadResponse>(`/community/threads/${threadId}/pin`, {}),
      onSuccess: (_data, { threadId, containerId }) => {
        queryClient.invalidateQueries({ queryKey: keys.threadDetail(threadId) })
        queryClient.invalidateQueries({ queryKey: keys.threads(containerId) })
      },
    })
  }

  function useUnpinThread() {
    const queryClient = useQueryClient()
    return useMutation<ThreadResponse, Error, { threadId: string; containerId: string }>({
      mutationFn: ({ threadId }) =>
        api.post<ThreadResponse>(`/community/threads/${threadId}/unpin`, {}),
      onSuccess: (_data, { threadId, containerId }) => {
        queryClient.invalidateQueries({ queryKey: keys.threadDetail(threadId) })
        queryClient.invalidateQueries({ queryKey: keys.threads(containerId) })
      },
    })
  }

  // ── Replies ───────────────────────────────────────────────────────────────────

  function useThreadReplies({ threadId, ...params }: ReplyListParams) {
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

  function useReply(replyId: string) {
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
        queryClient.invalidateQueries({ queryKey: keys.searchReplies() })
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
        queryClient.invalidateQueries({ queryKey: keys.searchReplies() })
      },
    })
  }

  function useDeleteReply() {
    const queryClient = useQueryClient()
    return useMutation<void, Error, { replyId: string; threadId: string }>({
      mutationFn: ({ replyId }) => api.delete<void>(`/community/replies/${replyId}`),
      onSuccess: (_data, { threadId }) => {
        queryClient.invalidateQueries({ queryKey: keys.replies(threadId) })
        queryClient.invalidateQueries({ queryKey: keys.searchReplies() })
      },
    })
  }

  // ── Thread Reactions ──────────────────────────────────────────────────────────

  function useThreadReactions(threadId: string) {
    return useQuery<ReactionBody[]>({
      queryKey: ['community', 'thread-reactions', threadId] as const,
      queryFn: () => api.get<ReactionBody[]>(`/community/threads/${threadId}/reactions`),
      enabled: !!threadId,
    })
  }

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

  function useReplyReactions(replyId: string) {
    return useQuery<ReactionBody[]>({
      queryKey: ['community', 'reply-reactions', replyId] as const,
      queryFn: () => api.get<ReactionBody[]>(`/community/replies/${replyId}/reactions`),
      enabled: !!replyId,
    })
  }

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

  // ── Members / Roles ───────────────────────────────────────────────────────────

  function useContainerMembers(containerId: string, params?: ListParams) {
    const query = params ? `?page=${params.page ?? 1}&pageSize=${params.pageSize ?? 20}` : ''
    return useQuery<PaginatedResponse<{ userId: string }>>({
      queryKey: keys.members(containerId),
      queryFn: () =>
        api.get<PaginatedResponse<{ userId: string }>>(
          `/community/containers/${containerId}/members${query}`,
        ),
      enabled: !!containerId,
    })
  }

  function useContainerModerators(containerId: string, params?: ListParams) {
    const query = params ? `?page=${params.page ?? 1}&pageSize=${params.pageSize ?? 20}` : ''
    return useQuery<PaginatedResponse<{ userId: string }>>({
      queryKey: keys.moderators(containerId),
      queryFn: () =>
        api.get<PaginatedResponse<{ userId: string }>>(
          `/community/containers/${containerId}/moderators${query}`,
        ),
      enabled: !!containerId,
    })
  }

  function useContainerOwners(containerId: string, params?: ListParams) {
    const query = params ? `?page=${params.page ?? 1}&pageSize=${params.pageSize ?? 20}` : ''
    return useQuery<PaginatedResponse<{ userId: string }>>({
      queryKey: keys.owners(containerId),
      queryFn: () =>
        api.get<PaginatedResponse<{ userId: string }>>(
          `/community/containers/${containerId}/owners${query}`,
        ),
      enabled: !!containerId,
    })
  }

  function useAddMember() {
    const queryClient = useQueryClient()
    return useMutation<void, Error, { containerId: string; userId: string }>({
      mutationFn: ({ containerId, userId }) =>
        api.post<void>(`/community/containers/${containerId}/members`, { userId }),
      onSuccess: (_data, { containerId }) => {
        queryClient.invalidateQueries({ queryKey: keys.members(containerId) })
      },
    })
  }

  function useRemoveMember() {
    const queryClient = useQueryClient()
    return useMutation<void, Error, { containerId: string; userId: string }>({
      mutationFn: ({ containerId, userId }) =>
        api.delete<void>(`/community/containers/${containerId}/members/${userId}`),
      onSuccess: (_data, { containerId }) => {
        queryClient.invalidateQueries({ queryKey: keys.members(containerId) })
      },
    })
  }

  function useAssignModerator() {
    const queryClient = useQueryClient()
    return useMutation<void, Error, { containerId: string; userId: string }>({
      mutationFn: ({ containerId, userId }) =>
        api.post<void>(`/community/containers/${containerId}/moderators`, { userId }),
      onSuccess: (_data, { containerId }) => {
        queryClient.invalidateQueries({ queryKey: keys.moderators(containerId) })
      },
    })
  }

  function useRemoveModerator() {
    const queryClient = useQueryClient()
    return useMutation<void, Error, { containerId: string; userId: string }>({
      mutationFn: ({ containerId, userId }) =>
        api.delete<void>(`/community/containers/${containerId}/moderators/${userId}`),
      onSuccess: (_data, { containerId }) => {
        queryClient.invalidateQueries({ queryKey: keys.moderators(containerId) })
      },
    })
  }

  function useAssignOwner() {
    const queryClient = useQueryClient()
    return useMutation<void, Error, { containerId: string; userId: string }>({
      mutationFn: ({ containerId, userId }) =>
        api.post<void>(`/community/containers/${containerId}/owners`, { userId }),
      onSuccess: (_data, { containerId }) => {
        queryClient.invalidateQueries({ queryKey: keys.owners(containerId) })
      },
    })
  }

  function useRemoveOwner() {
    const queryClient = useQueryClient()
    return useMutation<void, Error, { containerId: string; userId: string }>({
      mutationFn: ({ containerId, userId }) =>
        api.delete<void>(`/community/containers/${containerId}/owners/${userId}`),
      onSuccess: (_data, { containerId }) => {
        queryClient.invalidateQueries({ queryKey: keys.owners(containerId) })
      },
    })
  }

  // ── Reports ───────────────────────────────────────────────────────────────────

  function useReports(params?: ListParams) {
    const query = params ? `?page=${params.page ?? 1}&pageSize=${params.pageSize ?? 20}` : ''
    return useQuery<PaginatedResponse<ReportResponse>>({
      queryKey: keys.reports(),
      queryFn: () =>
        api.get<PaginatedResponse<ReportResponse>>(`/community/reports${query}`),
    })
  }

  function useReport(reportId: string) {
    return useQuery<ReportResponse>({
      queryKey: keys.report(reportId),
      queryFn: () => api.get<ReportResponse>(`/community/reports/${reportId}`),
      enabled: !!reportId,
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
      onSuccess: (_data, { reportId }) => {
        queryClient.invalidateQueries({ queryKey: keys.reports() })
        queryClient.invalidateQueries({ queryKey: keys.report(reportId) })
      },
    })
  }

  function useDismissReport() {
    const queryClient = useQueryClient()
    return useMutation<ReportResponse, Error, { reportId: string }>({
      mutationFn: ({ reportId }) =>
        api.post<ReportResponse>(`/community/reports/${reportId}/dismiss`, {}),
      onSuccess: (_data, { reportId }) => {
        queryClient.invalidateQueries({ queryKey: keys.reports() })
        queryClient.invalidateQueries({ queryKey: keys.report(reportId) })
      },
    })
  }

  // ── Bans ──────────────────────────────────────────────────────────────────────

  function useBans(params?: ListParams) {
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

  function useRemoveBan() {
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

  function useNotifications(params?: ListParams) {
    const query = params ? `?page=${params.page ?? 1}&pageSize=${params.pageSize ?? 20}` : ''
    return useQuery<PaginatedResponse<NotificationResponse>>({
      queryKey: keys.notifications(),
      queryFn: () =>
        api.get<PaginatedResponse<NotificationResponse>>(`/community/notifications${query}`),
    })
  }

  function useNotificationsUnreadCount() {
    return useQuery<{ count: number }>({
      queryKey: keys.notificationsUnread(),
      queryFn: () => api.get<{ count: number }>('/community/notifications/unread-count'),
    })
  }

  function useMarkNotificationRead() {
    const queryClient = useQueryClient()
    return useMutation<void, Error, { notificationId: string }>({
      mutationFn: ({ notificationId }) =>
        api.patch<void>(`/community/notifications/${notificationId}/read`, {}),
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: keys.notifications() })
        queryClient.invalidateQueries({ queryKey: keys.notificationsUnread() })
      },
    })
  }

  function useMarkAllNotificationsRead() {
    const queryClient = useQueryClient()
    return useMutation<void, Error, void>({
      mutationFn: () => api.post<void>('/community/notifications/read-all', {}),
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: keys.notifications() })
        queryClient.invalidateQueries({ queryKey: keys.notificationsUnread() })
      },
    })
  }

  // ── Search ────────────────────────────────────────────────────────────────────

  function useSearchThreads(params: CommunitySearchParams & { q: string }) {
    const qs = new URLSearchParams()
    if (params.q) qs.set('q', params.q)
    if (params.containerId) qs.set('containerId', params.containerId)
    if (params.page) qs.set('page', String(params.page))
    if (params.pageSize) qs.set('pageSize', String(params.pageSize))
    return useQuery<SearchResponse>({
      queryKey: [...keys.searchThreads(), params] as const,
      queryFn: () => api.get<SearchResponse>(`/community/search/threads?${qs.toString()}`),
      enabled: !!params.q,
    })
  }

  function useSearchReplies(params: CommunitySearchParams & { q: string }) {
    const qs = new URLSearchParams()
    if (params.q) qs.set('q', params.q)
    if (params.containerId) qs.set('containerId', params.containerId)
    if (params.page) qs.set('page', String(params.page))
    if (params.pageSize) qs.set('pageSize', String(params.pageSize))
    return useQuery<SearchResponse>({
      queryKey: [...keys.searchReplies(), params] as const,
      queryFn: () => api.get<SearchResponse>(`/community/search/replies?${qs.toString()}`),
      enabled: !!params.q,
    })
  }

  // ── Return all hooks ──────────────────────────────────────────────────────────

  return {
    // Containers
    useContainers,
    useContainer,
    useCreateContainer,
    useUpdateContainer,
    useDeleteContainer,
    // Threads
    useContainerThreads,
    useContainerThread,
    useCreateThread,
    useUpdateThread,
    useDeleteThread,
    usePublishThread,
    useLockThread,
    usePinThread,
    useUnpinThread,
    // Replies
    useThreadReplies,
    useReply,
    useCreateReply,
    useUpdateReply,
    useDeleteReply,
    // Thread reactions
    useThreadReactions,
    useReplyReactions,
    useAddThreadReaction,
    useRemoveThreadReaction,
    // Reply reactions
    useAddReplyReaction,
    useRemoveReplyReaction,
    // Members / Roles
    useContainerMembers,
    useContainerModerators,
    useContainerOwners,
    useAddMember,
    useRemoveMember,
    useAssignModerator,
    useRemoveModerator,
    useAssignOwner,
    useRemoveOwner,
    // Notifications
    useNotifications,
    useNotificationsUnreadCount,
    useMarkNotificationRead,
    useMarkAllNotificationsRead,
    // Reports
    useReports,
    useReport,
    useCreateReport,
    useResolveReport,
    useDismissReport,
    // Bans
    useBans,
    useCheckBan,
    useCreateBan,
    useRemoveBan,
    // Search
    useSearchThreads,
    useSearchReplies,
  }
}

export type CommunityHooks = ReturnType<typeof createCommunityHooks>
