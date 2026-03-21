export const communityContract = {
  // ── Containers ──────────────────────────────────────────────────────────────
  listContainers: {
    method: 'GET' as const,
    path: '/community/containers',
  },
  getContainer: {
    method: 'GET' as const,
    path: '/community/containers/:containerId',
  },
  createContainer: {
    method: 'POST' as const,
    path: '/community/containers',
  },
  updateContainer: {
    method: 'PATCH' as const,
    path: '/community/containers/:containerId',
  },
  deleteContainer: {
    method: 'DELETE' as const,
    path: '/community/containers/:containerId',
  },
  // ── Threads ─────────────────────────────────────────────────────────────────
  listThreads: {
    method: 'GET' as const,
    path: '/community/containers/:containerId/threads',
  },
  getThread: {
    method: 'GET' as const,
    path: '/community/threads/:threadId',
  },
  createThread: {
    method: 'POST' as const,
    path: '/community/containers/:containerId/threads',
  },
  updateThread: {
    method: 'PATCH' as const,
    path: '/community/threads/:threadId',
  },
  deleteThread: {
    method: 'DELETE' as const,
    path: '/community/threads/:threadId',
  },
  // ── Replies ─────────────────────────────────────────────────────────────────
  listReplies: {
    method: 'GET' as const,
    path: '/community/threads/:threadId/replies',
  },
  getReply: {
    method: 'GET' as const,
    path: '/community/replies/:replyId',
  },
  createReply: {
    method: 'POST' as const,
    path: '/community/threads/:threadId/replies',
  },
  updateReply: {
    method: 'PATCH' as const,
    path: '/community/replies/:replyId',
  },
  deleteReply: {
    method: 'DELETE' as const,
    path: '/community/replies/:replyId',
  },
  // ── Thread Reactions ────────────────────────────────────────────────────────
  addThreadReaction: {
    method: 'POST' as const,
    path: '/community/threads/:threadId/reactions',
  },
  removeThreadReaction: {
    method: 'DELETE' as const,
    path: '/community/threads/:threadId/reactions/:emoji',
  },
  // ── Reply Reactions ─────────────────────────────────────────────────────────
  addReplyReaction: {
    method: 'POST' as const,
    path: '/community/replies/:replyId/reactions',
  },
  removeReplyReaction: {
    method: 'DELETE' as const,
    path: '/community/replies/:replyId/reactions/:emoji',
  },
  // ── Reports ─────────────────────────────────────────────────────────────────
  listReports: {
    method: 'GET' as const,
    path: '/community/reports',
  },
  createReport: {
    method: 'POST' as const,
    path: '/community/reports',
  },
  resolveReport: {
    method: 'POST' as const,
    path: '/community/reports/:reportId/resolve',
  },
  // ── Bans ────────────────────────────────────────────────────────────────────
  listBans: {
    method: 'GET' as const,
    path: '/community/bans',
  },
  checkBan: {
    method: 'GET' as const,
    path: '/community/bans/check',
  },
  createBan: {
    method: 'POST' as const,
    path: '/community/bans',
  },
  deleteBan: {
    method: 'DELETE' as const,
    path: '/community/bans/:banId',
  },
  // ── Notifications ────────────────────────────────────────────────────────────
  listNotifications: {
    method: 'GET' as const,
    path: '/community/notifications',
  },
  markNotificationRead: {
    method: 'PATCH' as const,
    path: '/community/notifications/:notificationId/read',
  },
  markAllNotificationsRead: {
    method: 'POST' as const,
    path: '/community/notifications/read-all',
  },
  // ── Search ───────────────────────────────────────────────────────────────────
  search: {
    method: 'GET' as const,
    path: '/community/search',
  },
} as const
