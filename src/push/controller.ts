import type {
  PersonalPush,
  PushDisposition,
  PushOpenRoute,
  PushQuietHours,
} from './types'

export interface PersonalPushPolicyOptions {
  allowedCategories: string[]
  allowedRoutePrefixes: string[]
  now?: () => Date
}

const clone = <T>(value: T): T => structuredClone(value)

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
        (prefix) => route === prefix || route.startsWith(`${prefix}/`) || route.startsWith(`${prefix}?`),
      )
    ) {
      throw new Error('[pocketshot] Push route is not allowlisted')
    }
    return route
  }

  private inQuietHours(date: Date): boolean {
    if (!this.quietHours || this.quietHours.startMinute === this.quietHours.endMinute) return false
    const shifted = new Date(
      date.getTime() + (this.quietHours.timeZoneOffsetMinutes ?? 0) * 60_000,
    )
    const minute = shifted.getUTCHours() * 60 + shifted.getUTCMinutes()
    const { startMinute, endMinute } = this.quietHours
    return startMinute < endMinute
      ? minute >= startMinute && minute < endMinute
      : minute >= startMinute || minute < endMinute
  }
}
