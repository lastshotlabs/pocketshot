import type { AppStateManager } from './manager'
import type { LifecycleCoordinator, LifecycleState } from './coordinator'

export interface LifecycleBridgeOptions {
  onError?: (error: unknown) => void
}

/**
 * Connects Pocketshot's single React Native AppState subscription to durable,
 * ordered lifecycle recovery. The manager remains the only native listener.
 */
export async function bindLifecycleCoordinator(
  manager: AppStateManager,
  coordinator: LifecycleCoordinator,
  options: LifecycleBridgeOptions = {},
): Promise<() => void> {
  await coordinator.initialize(toLifecycleState(manager.state))
  const report = (operation: Promise<void>) => {
    void operation.catch((error) => options.onError?.(error))
  }
  const foreground = manager.onForeground(() => {
    report(coordinator.transition('active'))
  })
  const background = manager.onBackground(() => {
    report(coordinator.transition('background'))
  })
  return () => {
    foreground()
    background()
  }
}

function toLifecycleState(state: string): LifecycleState {
  if (state === 'active') return 'active'
  if (state === 'background') return 'background'
  return 'inactive'
}
