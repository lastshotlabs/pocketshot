export interface CommunityAttachment {
  id: string
  kind: 'image' | 'video' | 'file'
  uri: string
  status: 'pending' | 'uploaded' | 'failed'
}

export interface CommunityPoll {
  question: string
  options: { id: string; label: string; votes: number }[]
  votedOptionId: string | null
}

export interface CommunityDraft {
  id: string
  body: string
  mentions: string[]
  attachments: CommunityAttachment[]
  poll: CommunityPoll | null
}

export class CommunityComposerController {
  private drafts = new Map<string, CommunityDraft>()

  constructor(
    private readonly limits = { drafts: 100, mentions: 100, attachments: 20, bodyCharacters: 100_000 },
  ) {}

  get(id: string): CommunityDraft | null {
    const draft = this.drafts.get(id)
    return draft ? structuredClone(draft) : null
  }

  save(draft: CommunityDraft): void {
    if (!draft.id.trim()) throw new Error('Draft id is required')
    if (!this.drafts.has(draft.id) && this.drafts.size >= this.limits.drafts) {
      throw new Error('Community draft capacity exceeded')
    }
    if (
      draft.body.length > this.limits.bodyCharacters ||
      draft.mentions.length > this.limits.mentions ||
      draft.attachments.length > this.limits.attachments
    ) {
      throw new Error('Community draft content capacity exceeded')
    }
    if (draft.poll) validatePoll(draft.poll)
    this.drafts.set(draft.id, {
      ...structuredClone(draft),
      mentions: [...new Set(draft.mentions)],
      attachments: uniqueBy(draft.attachments, (attachment) => attachment.id),
    })
  }

  markAttachment(id: string, attachmentId: string, status: CommunityAttachment['status']): void {
    const draft = this.require(id)
    const attachment = draft.attachments.find((candidate) => candidate.id === attachmentId)
    if (!attachment) throw new Error(`Unknown attachment: ${attachmentId}`)
    attachment.status = status
  }

  publishable(id: string): boolean {
    const draft = this.require(id)
    return (
      (!!draft.body.trim() || draft.attachments.length > 0 || !!draft.poll) &&
      draft.attachments.every((attachment) => attachment.status === 'uploaded')
    )
  }

  vote(id: string, optionId: string): void {
    const draft = this.require(id)
    if (!draft.poll) throw new Error('Draft has no poll')
    if (draft.poll.votedOptionId) return
    const option = draft.poll.options.find((candidate) => candidate.id === optionId)
    if (!option) throw new Error(`Unknown poll option: ${optionId}`)
    option.votes += 1
    draft.poll.votedOptionId = optionId
  }

  private require(id: string): CommunityDraft {
    const draft = this.drafts.get(id)
    if (!draft) throw new Error(`Unknown draft: ${id}`)
    return draft
  }
}

export class SocialGraphController {
  private following = new Set<string>()
  private subscriptions = new Set<string>()

  constructor(private readonly capacity = 10_000) {
    if (!Number.isInteger(capacity) || capacity < 1)
      throw new Error('Social graph capacity is invalid')
  }

  get snapshot(): { following: string[]; subscriptions: string[] } {
    return { following: [...this.following], subscriptions: [...this.subscriptions] }
  }

  follow(userId: string): void {
    if (!this.following.has(userId) && this.following.size >= this.capacity) {
      throw new Error('Social graph capacity exceeded')
    }
    this.following.add(requireId(userId))
  }

  unfollow(userId: string): void {
    this.following.delete(userId)
  }

  subscribe(channelId: string): void {
    if (!this.subscriptions.has(channelId) && this.subscriptions.size >= this.capacity) {
      throw new Error('Social graph capacity exceeded')
    }
    this.subscriptions.add(requireId(channelId))
  }

  unsubscribe(channelId: string): void {
    this.subscriptions.delete(channelId)
  }
}

export type CommunityProfileVisibility = 'public' | 'followers' | 'private'

export interface CommunityProfile {
  userId: string
  handle: string
  displayName: string
  biography: string
  avatarUrl: string | null
  visibility: CommunityProfileVisibility
}

export class CommunityProfileController {
  private profiles = new Map<string, CommunityProfile>()
  private handles = new Map<string, string>()

  constructor(private readonly capacity = 10_000) {
    if (!Number.isInteger(capacity) || capacity < 1)
      throw new Error('Profile capacity is invalid')
  }

  get(userId: string): CommunityProfile | null {
    const profile = this.profiles.get(userId)
    return profile ? structuredClone(profile) : null
  }

  save(profile: CommunityProfile): void {
    const userId = requireId(profile.userId)
    const handle = normalizeHandle(profile.handle)
    if (!profile.displayName.trim()) throw new Error('Display name is required')
    if (profile.biography.length > 500) throw new Error('Biography cannot exceed 500 characters')
    if (profile.avatarUrl && !isSafeMediaUrl(profile.avatarUrl)) {
      throw new Error('Avatar URL must use HTTPS')
    }
    const claimedBy = this.handles.get(handle)
    if (claimedBy && claimedBy !== userId) throw new Error('Handle is already in use')
    if (!this.profiles.has(userId) && this.profiles.size >= this.capacity) {
      throw new Error('Profile capacity exceeded')
    }

    const previous = this.profiles.get(userId)
    if (previous && previous.handle !== handle) this.handles.delete(previous.handle)
    this.handles.set(handle, userId)
    this.profiles.set(userId, {
      ...structuredClone(profile),
      userId,
      handle,
      displayName: profile.displayName.trim(),
      biography: profile.biography.trim(),
    })
  }

  removeAvatar(userId: string): void {
    const profile = this.require(userId)
    profile.avatarUrl = null
  }

  canView(userId: string, viewerId: string | null, viewerFollows: boolean): boolean {
    const profile = this.require(userId)
    if (profile.visibility === 'public' || viewerId === userId) return true
    if (profile.visibility === 'private' || !viewerId) return false
    return viewerFollows
  }

  private require(userId: string): CommunityProfile {
    const profile = this.profiles.get(userId)
    if (!profile) throw new Error(`Unknown profile: ${userId}`)
    return profile
  }
}

export interface RoomPresence {
  userId: string
  state: 'online' | 'away' | 'offline'
  typing: boolean
}

export class RoomStateController {
  private readCursors = new Map<string, number>()
  private presence = new Map<string, RoomPresence>()
  private latestSequence = 0

  constructor(private readonly capacity = 10_000) {
    if (!Number.isInteger(capacity) || capacity < 1)
      throw new Error('Room state capacity is invalid')
  }

  get snapshot(): {
    latestSequence: number
    unread: Record<string, number>
    presence: RoomPresence[]
  } {
    return {
      latestSequence: this.latestSequence,
      unread: Object.fromEntries(
        [...this.readCursors].map(([roomId, cursor]) => [
          roomId,
          Math.max(0, this.latestSequence - cursor),
        ]),
      ),
      presence: [...this.presence.values()].map((value) => structuredClone(value)),
    }
  }

  receive(sequence: number): void {
    if (sequence > this.latestSequence) this.latestSequence = sequence
  }

  openRoom(roomId: string): void {
    const id = requireId(roomId)
    if (!this.readCursors.has(id) && this.readCursors.size >= this.capacity) {
      throw new Error('Room state capacity exceeded')
    }
    if (!this.readCursors.has(id)) this.readCursors.set(id, 0)
  }

  markRead(roomId: string, sequence: number): void {
    const id = requireId(roomId)
    const current = this.readCursors.get(id) ?? 0
    this.readCursors.set(id, Math.max(current, Math.min(sequence, this.latestSequence)))
  }

  setPresence(presence: RoomPresence): void {
    if (!this.presence.has(presence.userId) && this.presence.size >= this.capacity) {
      throw new Error('Room presence capacity exceeded')
    }
    this.presence.set(requireId(presence.userId), structuredClone(presence))
  }

  removePresence(userId: string): void {
    this.presence.delete(userId)
  }
}

export type CommunityAbility =
  | 'administer'
  | 'moderate'
  | 'ban'
  | 'broadcast'
  | 'manage_flags'
  | 'view_audit'
  | 'view_legal'

export interface AdminAuditEvent {
  actorId: string
  action: string
  targetId: string | null
  reason: string
  at: string
}

export interface CommunityAdminOptions {
  /** Trusted identities seeded from server-side bootstrap configuration. */
  bootstrapAdminIds: readonly string[]
  maxAuditEntries?: number
  maxBroadcasts?: number
}

export class CommunityAdminController {
  private grants = new Map<string, Set<CommunityAbility>>()
  private bans = new Map<string, { reason: string; expiresAt: string | null }>()
  private consent = new Map<string, boolean>()
  private flags = new Map<string, boolean>()
  private broadcasts: { id: string; body: string; publishedAt: string }[] = []
  private audit: AdminAuditEvent[] = []

  constructor(
    private readonly now: () => string = () => new Date().toISOString(),
    private readonly freshAuthWindowMs = 5 * 60 * 1000,
    private readonly options: CommunityAdminOptions = { bootstrapAdminIds: [] },
  ) {
    for (const actorId of options.bootstrapAdminIds) {
      const id = requireId(actorId)
      this.grants.set(id, new Set<CommunityAbility>(['administer']))
    }
  }

  get snapshot() {
    return {
      bans: Object.fromEntries(this.bans),
      consent: Object.fromEntries(this.consent),
      flags: Object.fromEntries(this.flags),
      broadcasts: structuredClone(this.broadcasts),
      audit: structuredClone(this.audit),
    }
  }

  grant(actorId: string, userId: string, ability: CommunityAbility): void {
    this.require(actorId, 'administer')
    const abilities = this.grants.get(userId) ?? new Set<CommunityAbility>()
    abilities.add(ability)
    this.grants.set(userId, abilities)
    this.record(actorId, 'grant', userId, ability)
  }

  revokeGrant(actorId: string, userId: string, ability: CommunityAbility): void {
    this.require(actorId, 'administer')
    if (ability === 'administer' && actorId === userId) {
      const otherAdmins = [...this.grants].some(
        ([id, abilities]) => id !== userId && abilities.has('administer'),
      )
      if (!otherAdmins) throw new Error('Cannot revoke the final administrator')
    }
    this.grants.get(userId)?.delete(ability)
    this.record(actorId, 'revoke_grant', userId, ability)
  }

  can(userId: string, ability: CommunityAbility): boolean {
    return this.grants.get(userId)?.has(ability) ?? false
  }

  setConsent(userId: string, policy: string, accepted: boolean): void {
    this.consent.set(`${requireId(userId)}:${requireId(policy)}`, accepted)
  }

  ban(
    actorId: string,
    userId: string,
    reason: string,
    authenticatedAt: string,
    expiresAt: string | null = null,
  ): void {
    this.require(actorId, 'ban')
    this.requireFreshAuth(authenticatedAt)
    if (!reason.trim()) throw new Error('Ban reason is required')
    requireId(userId)
    if (
      expiresAt &&
      (!Number.isFinite(Date.parse(expiresAt)) || Date.parse(expiresAt) <= Date.parse(this.now()))
    ) {
      throw new Error('Ban expiry must be a future timestamp')
    }
    this.bans.set(userId, { reason, expiresAt })
    this.record(actorId, 'ban', userId, reason)
  }

  setFlag(actorId: string, key: string, enabled: boolean, authenticatedAt: string): void {
    this.require(actorId, 'manage_flags')
    this.requireFreshAuth(authenticatedAt)
    this.flags.set(requireId(key), enabled)
    this.record(actorId, 'set_flag', key, String(enabled))
  }

  broadcast(actorId: string, id: string, body: string, authenticatedAt: string): void {
    this.require(actorId, 'broadcast')
    this.requireFreshAuth(authenticatedAt)
    if (!body.trim()) throw new Error('Broadcast body is required')
    if (this.broadcasts.some((candidate) => candidate.id === id)) return
    if (this.broadcasts.length >= (this.options.maxBroadcasts ?? 1_000)) {
      throw new Error('Broadcast retention limit reached')
    }
    this.broadcasts.push({ id: requireId(id), body, publishedAt: this.now() })
    this.record(actorId, 'broadcast', id, 'published')
  }

  viewLegal(actorId: string, document: string): string {
    this.require(actorId, 'view_legal')
    if (!document.trim()) throw new Error('Legal document is unavailable')
    return document
  }

  private require(userId: string, ability: CommunityAbility): void {
    if (!this.can(userId, ability)) throw new Error(`Missing ability: ${ability}`)
  }

  private requireFreshAuth(authenticatedAt: string): void {
    const age = Date.parse(this.now()) - Date.parse(authenticatedAt)
    if (!Number.isFinite(age) || age < 0 || age > this.freshAuthWindowMs) {
      throw new Error('Fresh authentication is required')
    }
  }

  private record(actorId: string, action: string, targetId: string | null, reason: string): void {
    this.audit.push({ actorId, action, targetId, reason, at: this.now() })
    this.audit = this.audit.slice(-(this.options.maxAuditEntries ?? 5_000))
  }
}

function validatePoll(poll: CommunityPoll): void {
  if (!poll.question.trim()) throw new Error('Poll question is required')
  if (poll.options.length < 2 || poll.options.length > 10) {
    throw new Error('Poll requires between 2 and 10 options')
  }
  if (new Set(poll.options.map((option) => option.id)).size !== poll.options.length) {
    throw new Error('Poll option ids must be unique')
  }
  if (poll.options.some((option) => !option.label.trim() || option.votes < 0)) {
    throw new Error('Poll options must have labels and non-negative votes')
  }
}

function uniqueBy<T>(items: T[], key: (item: T) => string): T[] {
  const seen = new Set<string>()
  return items.filter((item) => {
    const value = key(item)
    if (seen.has(value)) return false
    seen.add(value)
    return true
  })
}

function requireId(value: string): string {
  if (!value.trim()) throw new Error('Identifier is required')
  return value
}

function normalizeHandle(value: string): string {
  const handle = value.trim().replace(/^@/, '').toLocaleLowerCase()
  if (!/^[a-z0-9_]{3,30}$/.test(handle)) {
    throw new Error('Handle must be 3–30 letters, numbers, or underscores')
  }
  return handle
}

function isSafeMediaUrl(value: string): boolean {
  try {
    return new URL(value).protocol === 'https:'
  } catch {
    return false
  }
}
