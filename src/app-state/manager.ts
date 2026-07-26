import { AppState, type AppStateStatus } from 'react-native'

type ForegroundCallback = () => void
type BackgroundCallback = () => void

/**
 * Centralized AppState subscription manager.
 *
 * Registers a single AppState.addEventListener('change', ...) subscription for
 * the entire SDK instance. All other modules subscribe through this manager
 * rather than calling AppState.addEventListener directly.
 *
 * Lifecycle:
 *   1. Instantiate: new AppStateManager()
 *   2. Start: manager.start() — registers the native listener
 *   3. Subscribe: manager.onForeground(cb) / manager.onBackground(cb)
 *   4. Stop: manager.stop() — removes the native listener, clears all subscribers
 */
export class AppStateManager {
  private subscription: ReturnType<typeof AppState.addEventListener> | null = null
  private foregroundCallbacks = new Set<ForegroundCallback>()
  private backgroundCallbacks = new Set<BackgroundCallback>()
  private currentState: AppStateStatus = AppState.currentState

  /** Register the native AppState listener. Call once, typically in createPocketshot(). */
  start(): void {
    if (this.subscription) return
    this.subscription = AppState.addEventListener('change', (nextState: AppStateStatus) => {
      const prev = this.currentState
      this.currentState = nextState

      if (nextState === 'active' && prev !== 'active') {
        for (const cb of this.foregroundCallbacks) {
          try {
            cb()
          } catch {
            // Keep delivering lifecycle transitions to independent subscribers.
          }
        }
      } else if (nextState !== 'active' && prev === 'active') {
        for (const cb of this.backgroundCallbacks) {
          try {
            cb()
          } catch {
            // Keep delivering lifecycle transitions to independent subscribers.
          }
        }
      }
    })
  }

  /** Remove the native AppState listener and clear all subscriber callbacks. */
  stop(): void {
    this.subscription?.remove()
    this.subscription = null
    this.foregroundCallbacks.clear()
    this.backgroundCallbacks.clear()
  }

  /**
   * Subscribe to foreground transitions (app becomes active).
   * @returns An unsubscribe function.
   */
  onForeground(cb: ForegroundCallback): () => void {
    this.foregroundCallbacks.add(cb)
    return () => this.foregroundCallbacks.delete(cb)
  }

  /**
   * Subscribe to background transitions (app leaves active state).
   * @returns An unsubscribe function.
   */
  onBackground(cb: BackgroundCallback): () => void {
    this.backgroundCallbacks.add(cb)
    return () => this.backgroundCallbacks.delete(cb)
  }

  /** Current app state, synchronized with the native listener. */
  get state(): AppStateStatus {
    return this.currentState
  }
}
