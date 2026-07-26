import type { DeepLinkController } from './controller'

export interface NativeDeepLinkAdapter {
  getInitialUrl(): Promise<string | null>
  subscribe(listener: (url: string) => void): () => void
}

export interface ExpoLinkingModuleLike {
  getInitialURL(): Promise<string | null>
  addEventListener(type: 'url', listener: (event: { url: string }) => void): { remove(): void }
}

export interface NativeDeepLinkBindingOptions {
  onError?: (error: unknown) => void
}

export function createExpoDeepLinkAdapter(module: ExpoLinkingModuleLike): NativeDeepLinkAdapter {
  return {
    getInitialUrl: () => module.getInitialURL(),
    subscribe(listener) {
      const subscription = module.addEventListener('url', (event) => listener(event.url))
      return () => subscription.remove()
    },
  }
}

/**
 * Subscribes before reading the initial URL so Android intent delivery cannot
 * fall into the listener-registration gap. Controller dedupe handles overlap.
 */
export async function bindNativeDeepLinks(
  adapter: NativeDeepLinkAdapter,
  controller: DeepLinkController,
  options: NativeDeepLinkBindingOptions = {},
): Promise<() => void> {
  const report = (operation: Promise<unknown>) => {
    void operation.catch((error) => options.onError?.(error))
  }
  let initializing = true
  const buffered: string[] = []
  const unsubscribe = adapter.subscribe((url) => {
    if (initializing) buffered.push(url)
    else report(controller.ingest(url, 'warm'))
  })
  try {
    const initial = await adapter.getInitialUrl()
    if (initial) await controller.ingest(initial, 'cold')
    initializing = false
    for (const url of buffered) await controller.ingest(url, 'warm')
    return unsubscribe
  } catch (error) {
    unsubscribe()
    throw error
  }
}
