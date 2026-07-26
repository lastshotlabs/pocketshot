export type MediaKind = 'image' | 'video'
export type MediaSource = 'camera' | 'library'
export type MediaPermissionState = 'granted' | 'denied' | 'blocked' | 'unavailable'

export interface MediaAsset {
  uri: string
  name: string
  mimeType: string
  kind: MediaKind
  size: number
  width?: number
  height?: number
  durationMs?: number
  orientation?: number
}

export interface MediaLimits {
  allowedMimeTypes?: readonly string[]
  maxImageBytes?: number
  maxVideoBytes?: number
  maxVideoDurationMs?: number
  maxPendingBytes?: number
}

export interface MediaPermissionResult {
  state: MediaPermissionState
  canAskAgain: boolean
  openSettings?: () => Promise<void>
}

export interface MediaCaptureAdapter {
  requestPermission(source: MediaSource): Promise<MediaPermissionResult>
  acquire(source: MediaSource): Promise<MediaAsset | null>
}

export interface MediaTransformAdapter {
  transform(
    asset: MediaAsset,
    options: { maxDimension?: number; quality?: number; normalizeOrientation: boolean },
  ): Promise<MediaAsset>
}

export interface MediaUploadSession {
  id: string
  offset: number
  chunkSize: number
}

export interface MediaUploadAdapter {
  /** Declares how bytes reach the backend/storage service. */
  readonly strategy?: 'direct' | 'presigned' | 'multipart-resumable'
  createSession(input: { asset: MediaAsset; idempotencyKey: string }): Promise<MediaUploadSession>
  getOffset(sessionId: string): Promise<number>
  uploadChunk(input: {
    sessionId: string
    asset: MediaAsset
    offset: number
    length: number
    signal: AbortSignal
  }): Promise<{ offset: number }>
  complete(sessionId: string): Promise<{ fileUrl: string; metadata?: Record<string, unknown> }>
  cancel?(sessionId: string): Promise<void>
}

export type MediaAnalysisStatus =
  | { state: 'pending' | 'running' }
  | { state: 'complete'; result: unknown }
  | { state: 'failed'; error: string }
  | { state: 'cancelled' }

export interface MediaAnalysisAdapter {
  start(input: { fileUrl: string; idempotencyKey: string }): Promise<{ jobId: string }>
  status(jobId: string): Promise<MediaAnalysisStatus>
  cancel(jobId: string): Promise<void>
}

export interface MediaFileAdapter {
  remove(uri: string): Promise<void>
}

export type MediaPipelineStatus =
  | 'pending'
  | 'processing'
  | 'ready'
  | 'uploading'
  | 'paused'
  | 'uploaded'
  | 'analyzing'
  | 'complete'
  | 'failed'
  | 'cancelled'

export interface DurableMediaRecord {
  schemaVersion: 1
  id: string
  idempotencyKey: string
  source: MediaSource
  original: MediaAsset
  asset: MediaAsset
  status: MediaPipelineStatus
  uploadSessionId: string | null
  uploadChunkSize: number | null
  uploadedBytes: number
  fileUrl: string | null
  analysisJobId: string | null
  analysisResult: unknown
  attempts: number
  error: string | null
  createdAt: string
  updatedAt: string
  temporary: boolean
  localFilesCleaned: boolean
  /** True when terminal work succeeded but temporary-file deletion must be retried. */
  cleanupPending?: boolean
}

export interface MediaPipelineStorage {
  load(): Promise<DurableMediaRecord[]>
  save(records: DurableMediaRecord[]): Promise<void>
}

export interface MediaPipelineOptions {
  capture: MediaCaptureAdapter
  upload: MediaUploadAdapter
  storage: MediaPipelineStorage
  transform?: MediaTransformAdapter
  analysis?: MediaAnalysisAdapter
  files?: MediaFileAdapter
  limits?: MediaLimits
  transformOptions?: { maxDimension?: number; quality?: number; normalizeOrientation?: boolean }
  analyzeAfterUpload?: boolean
  retainLocalFile?: boolean
  now?: () => Date
  createId?: () => string
  wait?: (milliseconds: number) => Promise<void>
  analysisPollInterval?: number
  maxAnalysisPolls?: number
  /** Maximum durable pipeline records. Old clean terminal records are pruned first. Default: 500. */
  maxRecords?: number
  /** Maximum serialized bytes per durable record. Default: 1 MiB. */
  maxRecordBytes?: number
  /** Converts adapter failures into bounded, privacy-safe durable diagnostics. */
  sanitizeError?: (error: unknown) => string
}

export interface MediaPipelineDiagnostics {
  total: number
  pending: number
  active: number
  paused: number
  failed: number
  complete: number
  cancelled: number
  cleanupPending: number
  pendingBytes: number
}

export type MediaPipelineEvent =
  | { type: 'changed'; record: DurableMediaRecord }
  | { type: 'removed'; id: string }

export class MediaPermissionError extends Error {
  constructor(
    readonly result: MediaPermissionResult,
    readonly source: MediaSource,
  ) {
    super(`[pocketshot] ${source} permission is ${result.state}`)
    this.name = 'MediaPermissionError'
  }
}

export class MediaValidationError extends Error {
  constructor(
    readonly code: 'mime_type' | 'file_size' | 'duration' | 'quota',
    message: string,
  ) {
    super(message)
    this.name = 'MediaValidationError'
  }
}

export class MediaPipelineCapacityError extends Error {
  constructor(message = '[pocketshot] Media pipeline capacity exceeded') {
    super(message)
    this.name = 'MediaPipelineCapacityError'
  }
}

export class MediaCleanupError extends Error {
  constructor(readonly recordId: string) {
    super('[pocketshot] Temporary media cleanup must be retried')
    this.name = 'MediaCleanupError'
  }
}
