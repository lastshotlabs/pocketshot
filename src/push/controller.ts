import type {
  NativePushAdapter,
  NotificationTapEvent,
  PersonalPush,
  PushDisposition,
  PushLifecycleState,
  PushLifecycleStorage,
  PushNotification,
  PushOpenRoute,
  PushQuietHours,
  PushPermissionAdapter,
} from './types'

export interface PersonalPushPolicyOptions {
  allowedCategories: string[]
  allowedRoutePrefixes: string[]
  now?: () => Date
}

const clone = <T>(value: T): T => structuredClone(value)

export interface PushLifecycleControllerOptions {
  adapter: NativePushAdapter
  registerToken(token: string): Promise<void>
  unregisterToken?(token: string): Promise<void>
  permission?: PushPermissionAdapter
  storage?: PushLifecycleStorage
  projectId?: string
  maxRegistrationAttempts?: number
  wait?(milliseconds: number): Promise<void>
  onNotification?(notification: PushNotification): void
  onTap?(event: NotificationTapEvent, coldStart: boolean): void
  onError?(error: Error): void
}

/** Owns process-level native push behavior while routing and backend policy stay app-owned. */
export class PushLifecycleController {
  private value: PushLifecycleState = {
    status: 'idle',
    permission: null,
    token: null,
    lastNotification: null,
    lastTap: null,
    error: null,
  }
  private generation = 0
  private readonly listeners = new Set<(state: PushLifecycleState) => void>()
  private readonly seenTaps = new Set<string>()
  private unsubscribers: Array<() => void> = []
  private restored = false

  constructor(private readonly options: PushLifecycleControllerOptions) {}

  get state(): PushLifecycleState {
    return clone(this.value)
  }

  subscribe(listener: (state: PushLifecycleState) => void): () => void {
    this.listeners.add(listener)
    listener(this.state)
    return () => this.listeners.delete(listener)
  }

  async start(): Promise<void> {
    if (this.value.status === 'starting' || this.value.status === 'ready') return
    const generation = ++this.generation
    await this.restore()
    if (this.options.permission) {
      this.value.status = 'checking-permission'
      this.emit()
      const permission = await this.options.permission.getPermission()
      if (generation !== this.generation) return
      this.value.permission = clone(permission)
      if (!permission.granted) {
        this.value.status = 'permission-required'
        this.emit()
        return
      }
    }
    this.value.status = 'starting'
    this.value.error = null
    this.emit()
    try {
      const coldResponse = await this.options.adapter.getLastNotificationResponse()
      if (generation !== this.generation) return
      if (coldResponse) this.acceptTap(coldResponse, true)
      const token = await this.options.adapter.getExpoPushToken(this.options.projectId)
      if (generation !== this.generation) return
      await this.register(token, generation)
      if (generation !== this.generation) return
      this.unsubscribers = [
        this.options.adapter.subscribeReceived((notification) => {
          this.value.lastNotification = clone(notification)
          this.options.onNotification?.(clone(notification))
          this.emit()
        }),
        this.options.adapter.subscribeTapped((event) => this.acceptTap(event, false)),
        this.options.adapter.subscribeToken((nextToken) => {
          void this.register(nextToken, generation).catch((error) => this.fail(error, generation))
        }),
      ]
      this.value.status = 'ready'
      this.emit()
    } catch (error) {
      this.fail(error, generation)
    }
  }

  async enable(): Promise<boolean> {
    if (!this.options.permission) {
      await this.start()
      return this.value.status === 'ready'
    }
    const permission = await this.options.permission.requestPermission()
    this.value.permission = clone(permission)
    if (!permission.granted) {
      this.value.status = 'permission-required'
      this.emit()
      return false
    }
    this.value.status = 'idle'
    await this.start()
    return this.state.status === 'ready'
  }

  async openSettings(): Promise<void> {
    await this.options.permission?.openSettings?.()
  }

  async revoke(): Promise<void> {
    const token = this.value.token
    this.stop()
    if (token && this.options.unregisterToken) await this.options.unregisterToken(token)
    this.value.token = null
    this.value.status = 'revoked'
    this.seenTaps.clear()
    await this.options.storage?.clear()
    this.emit()
  }

  stop(): void {
    this.generation += 1
    for (const unsubscribe of this.unsubscribers.splice(0)) unsubscribe()
    this.value.status = 'stopped'
    this.emit()
  }

  private async register(token: string, generation: number): Promise<void> {
    if (!token || token === this.value.token) return
    const attempts = Math.max(1, this.options.maxRegistrationAttempts ?? 3)
    let failure: unknown
    for (let attempt = 1; attempt <= attempts; attempt += 1) {
      try {
        await this.options.registerToken(token)
        failure = null
        break
      } catch (error) {
        failure = error
        if (attempt < attempts) {
          await (this.options.wait ?? defaultWait)(Math.min(250 * 2 ** (attempt - 1), 2_000))
        }
      }
    }
    if (failure) throw failure
    if (generation !== this.generation) return
    this.value.token = token
    this.value.error = null
    await this.persist()
    this.emit()
  }

  private acceptTap(event: NotificationTapEvent, coldStart: boolean): void {
    const key = `${event.notification.notificationId}:${event.actionIdentifier}`
    if (this.seenTaps.has(key)) return
    this.seenTaps.add(key)
    this.value.lastTap = clone(event)
    this.options.onTap?.(clone(event), coldStart)
    void this.persist().catch((error) => this.options.onError?.(toError(error)))
    this.emit()
  }

  private fail(cause: unknown, generation: number): void {
    if (generation !== this.generation) return
    const error = cause instanceof Error ? cause : new Error(String(cause))
    this.value.status = 'failed'
    this.value.error = error.message
    this.options.onError?.(error)
    this.emit()
  }

  private emit(): void {
    const state = this.state
    for (const listener of this.listeners) listener(state)
  }

  private async restore(): Promise<void> {
    if (this.restored) return
    this.restored = true
    const snapshot = await this.options.storage?.get()
    if (!snapshot) return
    this.value.token = snapshot.token
    for (const key of snapshot.seenTapKeys) this.seenTaps.add(key)
  }

  private async persist(): Promise<void> {
    await this.options.storage?.set({
      token: this.value.token,
      seenTapKeys: [...this.seenTaps].slice(-100),
    })
  }
}

const defaultWait = (milliseconds: number) =>
  new Promise<void>((resolve) => setTimeout(resolve, milliseconds))

const toError = (cause: unknown): Error =>
  cause instanceof Error ? cause : new Error(String(cause))

export function createMemoryPushLifecycleStorage(): PushLifecycleStorage {
  let value: Awaited<ReturnType<PushLifecycleStorage['get']>> = null
  return {
    get: async () => (value ? clone(value) : null),
    set: async (snapshot) => {
      value = clone(snapshot)
    },
    clear: async () => {
      value = null
    },
  }
}

export class PersonalPushPolicyController {
  private readonly seen = new Set<string>()
  private readonly mutedRooms = new Set<string>()
  private readonly categoryPreferences = new Map<string, boolean>()
  private quietHours: PushQuietHours | null = null
  private pendingOpen: PushOpenRoute | null = null
  private readonly now: () => Date

  constructor(private readonly options: PersonalPushPolicyOptions) {
    this.now = options.now ?? (() => new Date())
  }

  setRoomMuted(roomId: string, muted: boolean): void {
    if (muted) this.mutedRooms.add(roomId)
    else this.mutedRooms.delete(roomId)
  }

  setCategoryEnabled(category: string, enabled: boolean): void {
    this.requireCategory(category)
    this.categoryPreferences.set(category, enabled)
  }

  setQuietHours(value: PushQuietHours | null): void {
    if (
      value &&
      (!Number.isInteger(value.startMinute) ||
        !Number.isInteger(value.endMinute) ||
        value.startMinute < 0 ||
        value.startMinute > 1439 ||
        value.endMinute < 0 ||
        value.endMinute > 1439)
    ) {
      throw new Error('[pocketshot] Quiet hours must use minutes from 0 through 1439')
    }
    this.quietHours = value ? clone(value) : null
  }

  evaluate(notification: PersonalPush): PushDisposition {
    this.requireCategory(notification.category)
    if (this.seen.has(notification.id)) return { status: 'suppressed', reason: 'duplicate' }
    this.seen.add(notification.id)
    const now = this.now()
    if (notification.expiresAt && new Date(notification.expiresAt).getTime() <= now.getTime()) {
      return { status: 'suppressed', reason: 'expired' }
    }
    if (notification.roomId && this.mutedRooms.has(notification.roomId)) {
      return { status: 'suppressed', reason: 'muted' }
    }
    if (this.categoryPreferences.get(notification.category) === false) {
      return { status: 'suppressed', reason: 'disabled-category' }
    }
    if (this.inQuietHours(now)) return { status: 'suppressed', reason: 'quiet-hours' }
    return { status: 'deliver', notification: clone(notification) }
  }

  open(notification: PersonalPush, coldStart: boolean): PushOpenRoute | null {
    if (!notification.route) return null
    const route = this.normalizeRoute(notification.route)
    const opened: PushOpenRoute = {
      notificationId: notification.id,
      route,
      openedAt: this.now().toISOString(),
      coldStart,
    }
    if (coldStart) this.pendingOpen = opened
    return clone(opened)
  }

  consumePendingOpen(): PushOpenRoute | null {
    const value = this.pendingOpen
    this.pendingOpen = null
    return value ? clone(value) : null
  }

  snapshot(): {
    mutedRooms: string[]
    categoryPreferences: Record<string, boolean>
    quietHours: PushQuietHours | null
  } {
    return {
      mutedRooms: [...this.mutedRooms].sort(),
      categoryPreferences: Object.fromEntries(
        [...this.categoryPreferences.entries()].sort(([left], [right]) =>
          left.localeCompare(right),
        ),
      ),
      quietHours: this.quietHours ? clone(this.quietHours) : null,
    }
  }

  restore(snapshot: ReturnType<PersonalPushPolicyController['snapshot']>): void {
    this.mutedRooms.clear()
    for (const room of snapshot.mutedRooms) this.mutedRooms.add(room)
    this.categoryPreferences.clear()
    for (const [category, enabled] of Object.entries(snapshot.categoryPreferences)) {
      this.requireCategory(category)
      this.categoryPreferences.set(category, enabled)
    }
    this.setQuietHours(snapshot.quietHours)
  }

  private requireCategory(category: string): void {
    if (!this.options.allowedCategories.includes(category)) {
      throw new Error(`[pocketshot] Unsupported push category: ${category}`)
    }
  }

  private normalizeRoute(value: string): string {
    let route: string
    try {
      const url = new URL(value, 'https://pocketshot.invalid')
      route = `${url.pathname}${url.search}${url.hash}`
    } catch {
      throw new Error('[pocketshot] Invalid push route')
    }
    if (
      !this.options.allowedRoutePrefixes.some(
        (prefix) =>
          route === prefix || route.startsWith(`${prefix}/`) || route.startsWith(`${prefix}?`),
      )
    ) {
      throw new Error('[pocketshot] Push route is not allowlisted')
    }
    return route
  }

  private inQuietHours(date: Date): boolean {
    if (!this.quietHours || this.quietHours.startMinute === this.quietHours.endMinute) return false
    const shifted = new Date(date.getTime() + (this.quietHours.timeZoneOffsetMinutes ?? 0) * 60_000)
    const minute = shifted.getUTCHours() * 60 + shifted.getUTCMinutes()
    const { startMinute, endMinute } = this.quietHours
    return startMinute < endMinute
      ? minute >= startMinute && minute < endMinute
      : minute >= startMinute || minute < endMinute
  }
}
