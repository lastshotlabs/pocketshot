import { describe, expect, it, vi } from 'vitest'
import {
  createMemoryMediaStorage,
  MediaPermissionError,
  MediaPipelineController,
  MediaValidationError,
  type MediaAnalysisAdapter,
  type MediaAsset,
  type MediaCaptureAdapter,
  type MediaUploadAdapter,
} from '../../src/media'

const image: MediaAsset = {
  uri: 'file:///tmp/photo.jpg',
  name: 'photo.jpg',
  mimeType: 'image/jpeg',
  kind: 'image',
  size: 10,
  width: 100,
  height: 100,
  orientation: 6,
}

function capture(state: 'granted' | 'denied' | 'blocked' = 'granted'): MediaCaptureAdapter {
  return {
    requestPermission: vi.fn(async () => ({
      state,
      canAskAgain: state === 'denied',
      openSettings: vi.fn(async () => undefined),
    })),
    acquire: vi.fn(async () => image),
  }
}

function uploader(options: { offsets?: Map<string, number>; block?: boolean } = {}) {
  const offsets = options.offsets ?? new Map<string, number>()
  let sessions = 0
  const adapter: MediaUploadAdapter = {
    createSession: vi.fn(async () => {
      sessions += 1
      const id = `session-${sessions}`
      offsets.set(id, 0)
      return { id, offset: 0, chunkSize: 4 }
    }),
    getOffset: vi.fn(async (id) => offsets.get(id) ?? 0),
    uploadChunk: vi.fn(async ({ sessionId, offset, length, signal }) => {
      if (options.block) {
        await new Promise<void>((_resolve, reject) => {
          signal.addEventListener('abort', () => {
            const error = new Error('aborted')
            error.name = 'AbortError'
            reject(error)
          })
        })
      }
      const next = offset + length
      offsets.set(sessionId, next)
      return { offset: next }
    }),
    complete: vi.fn(async (id) => ({ fileUrl: `https://cdn.test/${id}` })),
    cancel: vi.fn(async () => undefined),
  }
  return adapter
}

function controller(
  overrides: Partial<ConstructorParameters<typeof MediaPipelineController>[0]> = {},
) {
  return new MediaPipelineController({
    capture: capture(),
    upload: uploader(),
    storage: createMemoryMediaStorage(),
    createId: () => 'media-1',
    wait: async () => undefined,
    ...overrides,
  })
}

describe('MediaPipelineController', () => {
  it('captures, normalizes, uploads in chunks, analyzes, and cleans up', async () => {
    const upload = uploader()
    const transform = vi.fn(async (asset: MediaAsset) => ({
      ...asset,
      uri: 'file:///tmp/normalized.jpg',
      size: 9,
      orientation: 1,
    }))
    const statuses = [
      { state: 'running' as const },
      { state: 'complete' as const, result: { score: 92 } },
    ]
    const analysis: MediaAnalysisAdapter = {
      start: vi.fn(async () => ({ jobId: 'analysis-1' })),
      status: vi.fn(async () => statuses.shift()!),
      cancel: vi.fn(async () => undefined),
    }
    const remove = vi.fn(async () => undefined)
    const pipeline = controller({
      upload,
      transform: { transform },
      analysis,
      files: { remove },
    })

    const queued = await pipeline.acquire('camera')
    const result = await pipeline.run(queued!.id)

    expect(result.status).toBe('complete')
    expect(result.uploadedBytes).toBe(9)
    expect(result.analysisResult).toEqual({ score: 92 })
    expect(transform).toHaveBeenCalledWith(
      image,
      expect.objectContaining({ normalizeOrientation: true }),
    )
    expect(upload.uploadChunk).toHaveBeenCalledTimes(3)
    expect(analysis.start).toHaveBeenCalledTimes(1)
    expect(remove).toHaveBeenCalledWith('file:///tmp/normalized.jpg')
  })

  it('returns contextual permission denial with settings recovery', async () => {
    const pipeline = controller({ capture: capture('blocked') })
    const error = await pipeline.acquire('camera').catch((value: unknown) => value)

    expect(error).toBeInstanceOf(MediaPermissionError)
    const permissionError = error as MediaPermissionError
    expect(permissionError.result.state).toBe('blocked')
    expect(permissionError.result.openSettings).toBeTypeOf('function')
  })

  it.each([
    [{ ...image, mimeType: 'application/pdf' }, 'mime_type'],
    [{ ...image, size: 21 * 1024 * 1024 }, 'file_size'],
    [{ ...image, kind: 'video', mimeType: 'video/mp4', durationMs: 901_000 }, 'duration'],
  ] as const)('rejects invalid media metadata', async (asset, code) => {
    const pipeline = controller()
    const error = await pipeline.enqueue(asset).catch((value: unknown) => value)
    expect(error).toBeInstanceOf(MediaValidationError)
    expect((error as MediaValidationError).code).toBe(code)
  })

  it('enforces durable pending-file quota', async () => {
    let id = 0
    const pipeline = controller({
      createId: () => `media-${++id}`,
      limits: { maxPendingBytes: 15 },
    })
    await pipeline.enqueue(image)
    await expect(pipeline.enqueue({ ...image, uri: 'file:///tmp/2.jpg' })).rejects.toMatchObject({
      code: 'quota',
    })
  })

  it('resumes an interrupted upload from the server offset without a duplicate session', async () => {
    const storage = createMemoryMediaStorage()
    const firstUpload = uploader({ block: true })
    const first = controller({ storage, upload: firstUpload })
    const record = await first.enqueue(image)
    const running = first.run(record.id)
    await vi.waitFor(() => expect(firstUpload.uploadChunk).toHaveBeenCalled())
    await first.pause(record.id)
    await expect(running).rejects.toMatchObject({ name: 'AbortError' })

    const offsets = new Map([['session-1', 4]])
    const resumedUpload = uploader({ offsets })
    const restarted = controller({ storage, upload: resumedUpload })
    await restarted.load()
    const result = await restarted.run(record.id)

    expect(result.status).toBe('complete')
    expect(resumedUpload.createSession).not.toHaveBeenCalled()
    expect(resumedUpload.getOffset).toHaveBeenCalledWith('session-1')
  })

  it('deduplicates acquisition by stable idempotency key', async () => {
    let id = 0
    const pipeline = controller({ createId: () => `media-${++id}` })
    const first = await pipeline.enqueue(image, 'library', true, 'capture-123')
    const second = await pipeline.enqueue(image, 'library', true, 'capture-123')
    expect(second.id).toBe(first.id)
    expect(pipeline.list()).toHaveLength(1)
  })

  it('coalesces concurrent runs so only one upload is created', async () => {
    const upload = uploader()
    const pipeline = controller({ upload })
    const record = await pipeline.enqueue(image)
    const [first, second] = await Promise.all([pipeline.run(record.id), pipeline.run(record.id)])

    expect(first).toEqual(second)
    expect(upload.createSession).toHaveBeenCalledTimes(1)
    expect(upload.complete).toHaveBeenCalledTimes(1)
  })

  it('cancels remote upload and deletes temporary files', async () => {
    const upload = uploader()
    const remove = vi.fn(async () => undefined)
    const pipeline = controller({ upload, files: { remove } })
    const record = await pipeline.enqueue(image)
    await pipeline.run(record.id)
    await pipeline.cancel(record.id)

    expect(upload.cancel).toHaveBeenCalledWith('session-1')
    expect(remove).toHaveBeenCalledWith(image.uri)
    expect(pipeline.get(record.id)?.status).toBe('cancelled')
  })

  it('persists an analysis job so a retry does not start duplicate analysis', async () => {
    let statusCalls = 0
    const analysis: MediaAnalysisAdapter = {
      start: vi.fn(async () => ({ jobId: 'job-stable' })),
      status: vi.fn(async () => {
        statusCalls += 1
        if (statusCalls === 1) return { state: 'failed' as const, error: 'worker unavailable' }
        return { state: 'complete' as const, result: 'ok' }
      }),
      cancel: vi.fn(async () => undefined),
    }
    const pipeline = controller({ analysis })
    const record = await pipeline.enqueue(image)
    await expect(pipeline.run(record.id)).rejects.toThrow('worker unavailable')
    const result = await pipeline.retry(record.id)

    expect(result.analysisResult).toBe('ok')
    expect(analysis.start).toHaveBeenCalledTimes(1)
  })
})
