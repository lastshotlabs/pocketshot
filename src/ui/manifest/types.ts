import type { Action } from '../actions/types'
import type { TokenConfig } from '../tokens/types'

/** Config for a single component instance on a screen. */
export interface ComponentConfig {
  /** The component type key (e.g. 'DataList', 'TextInput', 'Card'). */
  type: string
  /** Unique ID within the screen — used for from-ref and testID. */
  id?: string
  /** Component-specific config (validated against the component's Zod schema). */
  [key: string]: unknown
}

/** Config for a full screen. */
export interface ScreenConfig {
  /** Screen identifier (usually the route path). */
  id: string
  /** Screen title shown in the header. */
  title?: string
  /** Ordered list of components to render. */
  components: ComponentConfig[]
  /** Initial screen state values. */
  initialValues?: Record<string, unknown>
}

/** The full manifest for an app. */
export interface ManifestConfig {
  /** App name. */
  name: string
  /** Token/theme config. */
  theme?: TokenConfig
  /** All screens, keyed by route path. */
  screens: Record<string, ScreenConfig>
}

// Re-export Action so manifest consumers have a single import point for action types
export type { Action }
