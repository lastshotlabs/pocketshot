export interface AccessibilityPreferences {
  fontScale: number
  reduceMotion: boolean
  reduceTransparency: boolean
  boldText: boolean
  highContrast: boolean
  screenReaderEnabled: boolean
}

export interface AccessibilityAdapter {
  announce(message: string): void | Promise<void>
  focus(target: string): void | Promise<void>
}

export class AccessibilityController {
  private value: AccessibilityPreferences = {
    fontScale: 1,
    reduceMotion: false,
    reduceTransparency: false,
    boldText: false,
    highContrast: false,
    screenReaderEnabled: false,
  }

  constructor(private readonly adapter: AccessibilityAdapter) {}

  get preferences(): AccessibilityPreferences {
    return structuredClone(this.value)
  }

  update(preferences: Partial<AccessibilityPreferences>): void {
    const next = { ...this.value, ...preferences }
    if (!Number.isFinite(next.fontScale) || next.fontScale < 0.5 || next.fontScale > 3.2) {
      throw new Error('Font scale must be between 0.5 and 3.2')
    }
    this.value = next
  }

  duration(milliseconds: number): number {
    if (!Number.isFinite(milliseconds) || milliseconds < 0) {
      throw new Error('Animation duration cannot be negative')
    }
    return this.value.reduceMotion ? 0 : milliseconds
  }

  contrast<T>(standard: T, high: T): T {
    return this.value.highContrast ? high : standard
  }

  async announce(message: string): Promise<void> {
    if (!message.trim() || !this.value.screenReaderEnabled) return
    await this.adapter.announce(message)
  }

  async restoreFocus(target: string): Promise<void> {
    if (!target.trim()) throw new Error('Focus target is required')
    await this.adapter.focus(target)
  }
}
