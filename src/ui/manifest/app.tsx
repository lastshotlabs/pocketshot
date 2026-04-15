import React from 'react'
import type { ApiClient } from '../../api/client'
import type { DesignTokens } from '../tokens/types'
import { manifestComponentRegistry } from './component-registry'
import { compileManifest } from './compiler'
import { resolveManifestScreen } from './navigation'
import { ScreenRenderer } from './renderer'
import { ManifestRuntimeProvider } from './runtime'
import type { ComponentConfig, ManifestConfig, ScreenConfig } from './types'

interface ManifestAppProps {
  manifest: ManifestConfig
  api: ApiClient
  tokens?: DesignTokens
  currentScreen?: ScreenConfig
  componentRegistry?: Record<string, React.ComponentType<ComponentConfig>>
}

export function ManifestApp({
  manifest,
  api,
  tokens,
  currentScreen,
  componentRegistry,
}: ManifestAppProps) {
  const compiled = compileManifest(manifest)
  const resolvedScreen = resolveManifestScreen(compiled.manifest, currentScreen)

  return (
    <ManifestRuntimeProvider manifest={compiled.manifest} api={api} tokens={tokens}>
      <ScreenRenderer
        screen={resolvedScreen}
        api={api}
        componentRegistry={componentRegistry ?? manifestComponentRegistry}
      />
    </ManifestRuntimeProvider>
  )
}
