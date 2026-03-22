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
  publishThread: {
    method: 'POST' as const,
    path: '/community/threads/:threadId/publish',
  },
  lockThread: {
    method: 'POST' as const,
    path: '/community/threads/:threadId/lock',
  },
  unlockThread: {
    method: 'POST' as const,
    path: '/community/threads/:threadId/unlock',
  },
  pinThread: {
    method: 'POST' as const,
    path: '/community/threads/:threadId/pin',
  },
  unpinThread: {
    method: 'POST' as const,
    path: '/community/threads/:threadId/unpin',
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
  threadReactions: {
    method: 'GET' as const,
    path: '/community/threads/:threadId/reactions',
  },
  addThreadReaction: {
    method: 'POST' as const,
    path: '/community/threads/:threadId/reactions',
  },
  removeThreadReaction: {
    method: 'DELETE' as const,
    path: '/community/threads/:threadId/reactions/:emoji',
  },
  // ── Reply Reactions ─────────────────────────────────────────────────────────
  replyReactions: {
    method: 'GET' as const,
    path: '/community/replies/:replyId/reactions',
  },
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
  getReport: {
    method: 'GET' as const,
    path: '/community/reports/:reportId',
  },
  createReport: {
    method: 'POST' as const,
    path: '/community/reports',
  },
  resolveReport: {
    method: 'POST' as const,
    path: '/community/reports/:reportId/resolve',
  },
  dismissReport: {
    method: 'POST' as const,
    path: '/community/reports/:reportId/dismiss',
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
  notificationsUnreadCount: {
    method: 'GET' as const,
    path: '/community/notifications/unread-count',
  },
  markNotificationRead: {
    method: 'PATCH' as const,
    path: '/community/notifications/:notificationId/read',
  },
  markAllNotificationsRead: {
    method: 'POST' as const,
    path: '/community/notifications/read-all',
  },
  // ── Members / Roles ──────────────────────────────────────────────────────────
  listMembers: {
    method: 'GET' as const,
    path: '/community/containers/:containerId/members',
  },
  addMember: {
    method: 'POST' as const,
    path: '/community/containers/:containerId/members',
  },
  removeMember: {
    method: 'DELETE' as const,
    path: '/community/containers/:containerId/members/:userId',
  },
  listModerators: {
    method: 'GET' as const,
    path: '/community/containers/:containerId/moderators',
  },
  assignModerator: {
    method: 'POST' as const,
    path: '/community/containers/:containerId/moderators',
  },
  removeModerator: {
    method: 'DELETE' as const,
    path: '/community/containers/:containerId/moderators/:userId',
  },
  listOwners: {
    method: 'GET' as const,
    path: '/community/containers/:containerId/owners',
  },
  assignOwner: {
    method: 'POST' as const,
    path: '/community/containers/:containerId/owners',
  },
  removeOwner: {
    method: 'DELETE' as const,
    path: '/community/containers/:containerId/owners/:userId',
  },
  // ── Search ───────────────────────────────────────────────────────────────────
  searchThreads: {
    method: 'GET' as const,
    path: '/community/search/threads',
  },
  searchReplies: {
    method: 'GET' as const,
    path: '/community/search/replies',
  },
} as const
