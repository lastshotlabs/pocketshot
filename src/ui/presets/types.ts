import type { ScreenConfig } from '../manifest/types'

/** A preset factory transforms a preset-specific config into a full ScreenConfig. */
export type PresetFactory<T = Record<string, unknown>> = (config: T) => ScreenConfig
