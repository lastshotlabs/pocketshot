import type { DurableMediaRecord, MediaAsset, MediaLimits } from './types'
import { MediaValidationError } from './types'

const DEFAULTS: Required<Omit<MediaLimits, 'allowedMimeTypes'>> & {
  allowedMimeTypes: readonly string[]
} = {
  allowedMimeTypes: ['image/jpeg', 'image/png', 'image/heic', 'image/webp', 'video/mp4'],
  maxImageBytes: 20 * 1024 * 1024,
  maxVideoBytes: 500 * 1024 * 1024,
  maxVideoDurationMs: 15 * 60 * 1000,
  maxPendingBytes: 1024 * 1024 * 1024,
}

export function resolveMediaLimits(limits: MediaLimits = {}): typeof DEFAULTS {
  return { ...DEFAULTS, ...limits }
}

export function validateMediaAsset(asset: MediaAsset, limits: MediaLimits = {}): void {
  const resolved = resolveMediaLimits(limits)
  if (!resolved.allowedMimeTypes.includes(asset.mimeType)) {
    throw new MediaValidationError(
      'mime_type',
      `[pocketshot] Unsupported media type: ${asset.mimeType}`,
    )
  }
  const maxBytes = asset.kind === 'image' ? resolved.maxImageBytes : resolved.maxVideoBytes
  if (!Number.isFinite(asset.size) || asset.size <= 0 || asset.size > maxBytes) {
    throw new MediaValidationError(
      'file_size',
      `[pocketshot] ${asset.kind} size must be between 1 and ${maxBytes} bytes`,
    )
  }
  if (
    asset.kind === 'video' &&
    asset.durationMs !== undefined &&
    asset.durationMs > resolved.maxVideoDurationMs
  ) {
    throw new MediaValidationError(
      'duration',
      `[pocketshot] Video exceeds ${resolved.maxVideoDurationMs}ms`,
    )
  }
}

export function validatePendingQuota(
  asset: MediaAsset,
  records: readonly DurableMediaRecord[],
  limits: MediaLimits = {},
): void {
  const pending = records
    .filter((record) => !['complete', 'cancelled'].includes(record.status))
    .reduce((total, record) => total + record.asset.size, 0)
  const maximum = resolveMediaLimits(limits).maxPendingBytes
  if (pending + asset.size > maximum) {
    throw new MediaValidationError(
      'quota',
      `[pocketshot] Pending media quota exceeds ${maximum} bytes`,
    )
  }
}
