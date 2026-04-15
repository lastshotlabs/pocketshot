import type { ManifestConfig } from './types'

export interface CompiledManifest {
  manifest: ManifestConfig
  entryScreen: string
}

export function compileManifest(manifest: ManifestConfig): CompiledManifest {
  const entryScreen = Object.keys(manifest.screens)[0]
  if (!entryScreen) {
    throw new Error('[pocketshot] Manifest compiler requires at least one screen')
  }

  return {
    manifest,
    entryScreen,
  }
}
