import type { ManifestConfig, ScreenConfig } from './types'

export function resolveManifestScreen(
  manifest: ManifestConfig,
  currentScreen?: ScreenConfig,
): ScreenConfig {
  if (currentScreen) {
    return currentScreen
  }

  const firstScreen = Object.values(manifest.screens)[0]
  if (!firstScreen) {
    throw new Error('[pocketshot] ManifestApp requires at least one screen in manifest.screens')
  }

  return firstScreen
}
