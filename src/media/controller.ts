import type {
  DurableMediaRecord,
  MediaAsset,
  MediaPipelineEvent,
  MediaPipelineOptions,
  MediaSource,
} from './types'
import { MediaPermissionError } from './types'
import { validateMediaAsset, validatePendingQuota } from './validation'

const clone = <T>(value: T): T => JSON.parse(JSON.stringify(value)) as T

export class MediaPipelineController {
  private records: DurableMediaRecord[] = []
  private loaded = false
  private loadPromise: Promise<void> | null = null
  private readonly listeners = new Set<(event: MediaPipelineEvent) => void>()
  private readonly aborters = new Map<string, AbortController>()
  private readonly paused = new Set<string>()
  private readonly runs = new Map<string, Promise<DurableMediaRecord>>()

  constructor(private readonly options: MediaPipelineOptions) {}

  subscribe(listener: (event: MediaPipelineEvent) => void): () => void {
    this.listeners.add(listener)
    return () => this.listeners.delete(listener)
  }

  async load(): Promise<DurableMediaRecord[]> {
    if (!this.loaded) {
      this.loadPromise ??= (async () => {
        this.records = (await this.options.storage.load()).map((stored) => {
          const record = { ...stored }
          record.localFilesCleaned ??= false
          return ['processing', 'uploading', 'analyzing'].includes(record.status)
            ? {
                ...record,
                status: 'paused',
                error: 'Recovered after process interruption',
                updatedAt: this.now(),
              }
            : record
        })
        this.loaded = true
        await this.persist()
      })()
      await this.loadPromise
    }
    return this.list()
  }

  list(): DurableMediaRecord[] {
    return clone(this.records)
  }

  get(id: string): DurableMediaRecord | null {
    const record = this.records.find((candidate) => candidate.id === id)
    return record ? clone(record) : null
  }

  async acquire(source: MediaSource, temporary = true): Promise<DurableMediaRecord | null> {
    await this.load()
    const permission = await this.options.capture.requestPermission(source)
    if (permission.state !== 'granted') throw new MediaPermissionError(permission, source)
    const asset = await this.options.capture.acquire(source)
    if (!asset) return null
    return this.enqueue(asset, source, temporary)
  }

  async enqueue(
    asset: MediaAsset,
    source: MediaSource = 'library',
    temporary = true,
    idempotencyKey?: string,
  ): Promise<DurableMediaRecord> {
    await this.load()
    const duplicate = this.records.find((record) => record.idempotencyKey === idempotencyKey)
    if (duplicate) return clone(duplicate)
    validateMediaAsset(asset, this.options.limits)
    validatePendingQuota(asset, this.records, this.options.limits)
    const id = this.options.createId?.() ?? `${Date.now()}-${Math.random().toString(36).slice(2)}`
    const key = idempotencyKey ?? id
    const timestamp = this.now()
    const record: DurableMediaRecord = {
      schemaVersion: 1,
      id,
      idempotencyKey: key,
      source,
      original: clone(asset),
      asset: clone(asset),
      status: 'pending',
      uploadSessionId: null,
      uploadChunkSize: null,
      uploadedBytes: 0,
      fileUrl: null,
      analysisJobId: null,
      analysisResult: null,
      attempts: 0,
      error: null,
      createdAt: timestamp,
      updatedAt: timestamp,
      temporary,
      localFilesCleaned: false,
    }
    this.records.push(record)
    await this.changed(record)
    return clone(record)
  }

  run(id: string): Promise<DurableMediaRecord> {
    const existing = this.runs.get(id)
    if (existing) return existing
    const running = this.execute(id).finally(() => this.runs.delete(id))
    this.runs.set(id, running)
    return running
  }

  private async execute(id: string): Promise<DurableMediaRecord> {
    await this.load()
    const record = this.require(id)
    if (record.status === 'complete') return clone(record)
    if (record.status === 'cancelled') throw new Error('[pocketshot] Cannot run cancelled media')
    this.paused.delete(id)
    try {
      if (['pending', 'processing', 'failed'].includes(record.status) && !record.fileUrl) {
        await this.process(record)
      }
      if (!record.fileUrl) await this.upload(record)
      if (record.fileUrl && this.options.analysis && (this.options.analyzeAfterUpload ?? true)) {
        await this.analyze(record)
      } else if (record.fileUrl) {
        await this.update(record, { status: 'complete', error: null })
        await this.cleanup(record)
      }
      return clone(record)
    } catch (error) {
      if (this.paused.has(id) || isAbort(error)) {
        await this.update(record, { status: 'paused', error: null })
      } else {
        await this.update(record, {
          status: 'failed',
          attempts: record.attempts + 1,
          error: error instanceof Error ? error.message : String(error),
        })
      }
      throw error
    } finally {
      this.aborters.delete(id)
    }
  }

  async pause(id: string): Promise<void> {
    const record = this.require(id)
    this.paused.add(id)
    this.aborters.get(id)?.abort()
    await this.update(record, { status: 'paused' })
  }

  async retry(id: string): Promise<DurableMediaRecord> {
    const record = this.require(id)
    await this.update(record, { error: null })
    return this.run(id)
  }

  async cancel(id: string): Promise<void> {
    const record = this.require(id)
    this.paused.add(id)
    this.aborters.get(id)?.abort()
    if (record.analysisJobId && this.options.analysis) {
      await this.options.analysis.cancel(record.analysisJobId)
    }
    if (record.uploadSessionId) await this.options.upload.cancel?.(record.uploadSessionId)
    await this.update(record, { status: 'cancelled', error: null })
    await this.cleanup(record)
  }

  async remove(id: string): Promise<void> {
    const record = this.require(id)
    await this.cleanup(record)
    this.records = this.records.filter((candidate) => candidate.id !== id)
    await this.persist()
    for (const listener of this.listeners) listener({ type: 'removed', id })
  }

  private async process(record: DurableMediaRecord): Promise<void> {
    if (!this.options.transform) {
      await this.update(record, { status: 'ready' })
      return
    }
    await this.update(record, { status: 'processing' })
    const asset = await this.options.transform.transform(record.asset, {
      ...this.options.transformOptions,
      normalizeOrientation: this.options.transformOptions?.normalizeOrientation ?? true,
    })
    validateMediaAsset(asset, this.options.limits)
    await this.update(record, { asset, status: 'ready' })
  }

  private async upload(record: DurableMediaRecord): Promise<void> {
    let sessionId = record.uploadSessionId
    let offset = record.uploadedBytes
    if (sessionId) {
      offset = await this.options.upload.getOffset(sessionId)
    } else {
      const session = await this.options.upload.createSession({
        asset: record.asset,
        idempotencyKey: record.idempotencyKey,
      })
      sessionId = session.id
      offset = session.offset
      await this.update(record, {
        uploadSessionId: sessionId,
        uploadChunkSize: session.chunkSize,
        uploadedBytes: offset,
      })
    }
    await this.update(record, { status: 'uploading', error: null })
    while (offset < record.asset.size) {
      if (this.paused.has(record.id)) throw abortError()
      const controller = new AbortController()
      this.aborters.set(record.id, controller)
      const length = Math.min(record.asset.size - offset, record.uploadChunkSize ?? 5 * 1024 * 1024)
      const result = await this.options.upload.uploadChunk({
        sessionId,
        asset: record.asset,
        offset,
        length,
        signal: controller.signal,
      })
      if (result.offset <= offset || result.offset > record.asset.size) {
        throw new Error('[pocketshot] Upload adapter returned an invalid offset')
      }
      offset = result.offset
      await this.update(record, { uploadedBytes: offset })
    }
    const completed = await this.options.upload.complete(sessionId)
    await this.update(record, { fileUrl: completed.fileUrl, status: 'uploaded' })
  }

  private async analyze(record: DurableMediaRecord): Promise<void> {
    let jobId = record.analysisJobId
    if (!jobId) {
      const started = await this.options.analysis!.start({
        fileUrl: record.fileUrl!,
        idempotencyKey: record.idempotencyKey,
      })
      jobId = started.jobId
      await this.update(record, { analysisJobId: jobId })
    }
    await this.update(record, { status: 'analyzing' })
    const maximum = this.options.maxAnalysisPolls ?? 120
    for (let poll = 0; poll < maximum; poll += 1) {
      if (this.paused.has(record.id)) throw abortError()
      const status = await this.options.analysis!.status(jobId)
      if (status.state === 'complete') {
        await this.update(record, {
          status: 'complete',
          analysisResult: status.result,
          error: null,
        })
        await this.cleanup(record)
        return
      }
      if (status.state === 'failed') throw new Error(status.error)
      if (status.state === 'cancelled') throw new Error('[pocketshot] Analysis was cancelled')
      await (this.options.wait ?? defaultWait)(this.options.analysisPollInterval ?? 1_000)
    }
    throw new Error('[pocketshot] Analysis polling limit reached')
  }

  private async cleanup(record: DurableMediaRecord): Promise<void> {
    if (
      record.temporary &&
      !record.localFilesCleaned &&
      !(this.options.retainLocalFile ?? false) &&
      this.options.files &&
      record.asset.uri
    ) {
      const uris = new Set([record.original.uri, record.asset.uri])
      await Promise.all([...uris].map((uri) => this.options.files!.remove(uri)))
      record.localFilesCleaned = true
      record.updatedAt = this.now()
      await this.persist()
    }
  }

  private require(id: string): DurableMediaRecord {
    const record = this.records.find((candidate) => candidate.id === id)
    if (!record) throw new Error(`[pocketshot] Unknown media record: ${id}`)
    return record
  }

  private async update(
    record: DurableMediaRecord,
    patch: Partial<DurableMediaRecord>,
  ): Promise<void> {
    Object.assign(record, patch, { updatedAt: this.now() })
    await this.changed(record)
  }

  private async changed(record: DurableMediaRecord): Promise<void> {
    await this.persist()
    const event: MediaPipelineEvent = { type: 'changed', record: clone(record) }
    for (const listener of this.listeners) listener(event)
  }

  private async persist(): Promise<void> {
    await this.options.storage.save(this.records)
  }

  private now(): string {
    return (this.options.now?.() ?? new Date()).toISOString()
  }
}

function isAbort(error: unknown): boolean {
  return error instanceof Error && error.name === 'AbortError'
}

function defaultWait(milliseconds: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, milliseconds))
}

function abortError(): Error {
  const error = new Error('Paused')
  error.name = 'AbortError'
  return error
}
