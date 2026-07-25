export type MobileOrientation = 'portrait' | 'landscape' | 'any'
export type MobilePlatform = 'ios' | 'android'

export interface MobileRouteDefinition {
  name: string
  immersive: boolean
  orientation?: MobileOrientation
  focusTarget?: string
}

export interface MobileShellSnapshot {
  route: string
  tabsVisible: boolean
  orientation: MobileOrientation
  focusTarget: string | null
  history: string[]
}

export class MobileShellController {
  private readonly routes = new Map<string, MobileRouteDefinition>()
  private history: string[] = []
  private current: MobileRouteDefinition

  constructor(
    definitions: MobileRouteDefinition[],
    initialRoute: string,
    private readonly focus: (target: string) => void | Promise<void> = () => undefined,
  ) {
    for (const definition of definitions) {
      if (!definition.name.trim()) throw new Error('Route name is required')
      if (this.routes.has(definition.name)) throw new Error(`Duplicate route: ${definition.name}`)
      this.routes.set(definition.name, structuredClone(definition))
    }
    this.current = this.require(initialRoute)
  }

  get snapshot(): MobileShellSnapshot {
    return {
      route: this.current.name,
      tabsVisible: !this.current.immersive,
      orientation: this.current.orientation ?? 'any',
      focusTarget: this.current.focusTarget ?? null,
      history: [...this.history],
    }
  }

  async navigate(route: string): Promise<void> {
    const next = this.require(route)
    if (next.name === this.current.name) return
    this.history.push(this.current.name)
    this.current = next
    await this.restoreCurrentFocus()
  }

  async back(): Promise<boolean> {
    const previous = this.history.pop()
    if (!previous) return false
    this.current = this.require(previous)
    await this.restoreCurrentFocus()
    return true
  }

  async replace(route: string): Promise<void> {
    this.current = this.require(route)
    await this.restoreCurrentFocus()
  }

  async restoreCurrentFocus(): Promise<void> {
    if (this.current.focusTarget) await this.focus(this.current.focusTarget)
  }

  private require(name: string): MobileRouteDefinition {
    const route = this.routes.get(name)
    if (!route) throw new Error(`Unknown route: ${name}`)
    return route
  }
}

export function minimumTouchTarget(platform: MobilePlatform): number {
  return platform === 'ios' ? 44 : 48
}

export function conformTouchTarget(
  platform: MobilePlatform,
  size: { width: number; height: number },
): { width: number; height: number } {
  const minimum = minimumTouchTarget(platform)
  return {
    width: Math.max(minimum, size.width),
    height: Math.max(minimum, size.height),
  }
}

export function safeAreaThumbDock(input: {
  viewportHeight: number
  bottomInset: number
  keyboardHeight?: number
  contentHeight: number
}): { bottom: number; top: number } {
  for (const [name, value] of Object.entries(input)) {
    if (!Number.isFinite(value) || value < 0) throw new Error(`${name} cannot be negative`)
  }
  const bottom = Math.max(input.bottomInset, input.keyboardHeight ?? 0)
  return {
    bottom,
    top: Math.max(0, input.viewportHeight - bottom - input.contentHeight),
  }
}
