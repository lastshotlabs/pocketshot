import type { MediaPipelineController } from './controller'

export interface MediaLifecycle {
  currentState(): 'active' | 'background' | 'inactive'
  subscribe(listener: (state: 'active' | 'background' | 'inactive') => void): () => void
}

export interface MediaNetwork {
  isOnline(): boolean
  subscribe(listener: (online: boolean) => void): () => void
}

export function bindMediaLifecycle(
  pipeline: MediaPipelineController,
  lifecycle: MediaLifecycle,
  onError: (error: unknown) => void = () => undefined,
): () => void {
  const handle = (state: 'active' | 'background' | 'inactive') => {
    if (state === 'active') void resumeRecoverable(pipeline).catch(onError)
    else void pauseActive(pipeline).catch(onError)
  }
  handle(lifecycle.currentState())
  return lifecycle.subscribe(handle)
}

export function bindMediaNetwork(
  pipeline: MediaPipelineController,
  network: MediaNetwork,
  onError: (error: unknown) => void = () => undefined,
): () => void {
  const handle = (online: boolean) => {
    if (online) void resumeRecoverable(pipeline).catch(onError)
    else void pauseActive(pipeline).catch(onError)
  }
  handle(network.isOnline())
  return network.subscribe(handle)
}

async function pauseActive(pipeline: MediaPipelineController): Promise<void> {
  const active = pipeline
    .list()
    .filter((record) => ['processing', 'uploading', 'analyzing'].includes(record.status))
  await Promise.all(active.map((record) => pipeline.pause(record.id)))
}

async function resumeRecoverable(pipeline: MediaPipelineController): Promise<void> {
  const recoverable = (await pipeline.load()).filter((record) =>
    ['pending', 'ready', 'paused', 'uploaded'].includes(record.status),
  )
  await Promise.all(recoverable.map((record) => pipeline.run(record.id)))
}
