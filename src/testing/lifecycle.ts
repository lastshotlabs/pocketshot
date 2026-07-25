export type TestAppState = 'active' | 'background' | 'inactive'

type Callback = () => void

export class LifecycleHarness {
  private foreground = new Set<Callback>()
  private background = new Set<Callback>()

  constructor(private current: TestAppState = 'active') {}

  onForeground(callback: Callback): () => void {
    this.foreground.add(callback)
    return () => this.foreground.delete(callback)
  }

  onBackground(callback: Callback): () => void {
    this.background.add(callback)
    return () => this.background.delete(callback)
  }

  transition(next: TestAppState): void {
    const previous = this.current
    if (next === previous) return
    this.current = next
    if (next === 'active' && previous !== 'active') {
      for (const callback of this.foreground) callback()
    } else if (next !== 'active' && previous === 'active') {
      for (const callback of this.background) callback()
    }
  }

  get state(): TestAppState {
    return this.current
  }
}
