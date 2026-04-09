import { useCallback, useState } from 'react'
import type { ApiClient } from '../api/client'
import type { TokenStorage } from '../auth/storage'
import type {
  UploadFile,
  UploadProgress,
  PresignedUploadResponse,
  UploadResult,
  PresignedUploadOptions,
  DirectUploadOptions,
} from './types'

// ── XMLHttpRequest upload with progress ────────────────────────────────────────
// fetch() doesn't support upload progress in React Native. XHR does.
// The project's tsconfig uses lib: ["ESNext"] (no DOM), so we define a local
// alias for the XHR body union rather than relying on the DOM lib type.
type XhrBody = string | FormData | ArrayBuffer | ArrayBufferView | Blob | null

function uploadWithProgress(
  url: string,
  body: XhrBody,
  method: 'PUT' | 'POST',
  headers: Record<string, string>,
  onProgress?: (p: UploadProgress) => void,
): Promise<{ status: number; body: string }> {
  return new Promise((resolve, reject) => {
    const xhr = new XMLHttpRequest()
    xhr.open(method, url)

    for (const [key, value] of Object.entries(headers)) {
      xhr.setRequestHeader(key, value)
    }

    if (onProgress) {
      xhr.upload.onprogress = (e) => {
        onProgress({
          loaded: e.loaded,
          total: e.total,
          percent: e.lengthComputable ? e.loaded / e.total : null,
        })
      }
    }

    xhr.onload = () => resolve({ status: xhr.status, body: xhr.responseText })
    xhr.onerror = () => reject(new Error('[pocketshot] Upload network error'))
    xhr.ontimeout = () => reject(new Error('[pocketshot] Upload timed out'))
    xhr.send(body)
  })
}

// ── Factory ────────────────────────────────────────────────────────────────────

/**
 * Creates upload hooks bound to the provided API client, base URL, and token storage.
 *
 * @param api - The SDK API client instance (used for presign requests with auth + retry).
 * @param opts - Base URL and token storage for direct XHR uploads.
 */
export function createUploadHooks(
  api: ApiClient,
  opts: { baseUrl: string; tokenStorage: TokenStorage },
) {
  const { baseUrl, tokenStorage } = opts

  /**
   * Hook for presigned URL uploads (recommended for large files).
   *
   * Flow:
   *   1. POST to presign endpoint → get { uploadUrl, fileUrl }
   *   2. PUT file directly to storage URL (e.g. S3/R2/GCS) via XHR for progress tracking
   *   3. Return { fileUrl, file }
   *
   * Supports upload progress tracking via XHR (fetch doesn't expose upload progress in RN).
   *
   * @example
   * const { upload, progress, isUploading, result, error, reset } = usePresignedUpload()
   *
   * const result = await upload(
   *   { uri, mimeType: 'image/jpeg', name: 'photo.jpg' },
   *   { onProgress: (p) => setPercent(p.percent) }
   * )
   * // result.fileUrl → 'https://cdn.example.com/uploads/photo.jpg'
   */
  function usePresignedUpload(defaultOpts: PresignedUploadOptions = {}) {
    const [isUploading, setIsUploading] = useState(false)
    const [progress, setProgress] = useState<UploadProgress | null>(null)
    const [result, setResult] = useState<UploadResult | null>(null)
    const [error, setError] = useState<Error | null>(null)

    const reset = useCallback(() => {
      setIsUploading(false)
      setProgress(null)
      setResult(null)
      setError(null)
    }, [])

    const upload = useCallback(
      async (file: UploadFile, callOpts: PresignedUploadOptions = {}): Promise<UploadResult> => {
        const mergedOpts = { ...defaultOpts, ...callOpts }
        const presignEndpoint = mergedOpts.presignEndpoint ?? '/upload/presign'
        // Prefer the call-site onProgress if provided, fall back to default.
        const onProgress = callOpts.onProgress ?? defaultOpts.onProgress

        setIsUploading(true)
        setProgress(null)
        setError(null)

        try {
          // Step 1: Get presigned URL from backend (uses ApiClient for auth + token refresh).
          const presigned = await api.post<PresignedUploadResponse>(presignEndpoint, {
            fileName: file.name,
            mimeType: file.mimeType,
            size: file.size,
            ...mergedOpts.presignBody,
          })

          // Step 2: PUT file directly to storage via XHR for progress events.
          // React Native's FormData accepts { uri, type, name } objects as file blobs.
          const { status } = await uploadWithProgress(
            presigned.uploadUrl,
            { uri: file.uri, type: file.mimeType, name: file.name } as unknown as XhrBody,
            'PUT',
            {
              'Content-Type': file.mimeType,
              ...presigned.fields,
            },
            (p) => {
              setProgress(p)
              onProgress?.(p)
            },
          )

          if (status >= 400) {
            throw new Error(`[pocketshot] Presigned upload failed with status ${status}`)
          }

          const uploadResult: UploadResult = { fileUrl: presigned.fileUrl, file }
          setResult(uploadResult)
          return uploadResult
        } catch (e) {
          const err = e instanceof Error ? e : new Error(String(e))
          setError(err)
          throw err
        } finally {
          setIsUploading(false)
        }
      },
      // eslint-disable-next-line react-hooks/exhaustive-deps
      [],
    )

    return { upload, progress, isUploading, result, error, reset }
  }

  /**
   * Hook for direct multipart/form-data uploads to the backend.
   * Suitable for small files or backends that handle storage internally.
   *
   * The backend response is parsed as JSON and expected to contain a `fileUrl` or
   * `url` field. If the response is not JSON or neither field is present, the
   * original local file URI is used as the fallback.
   *
   * @example
   * const { upload, progress, isUploading, result, error, reset } = useDirectUpload()
   *
   * const result = await upload(
   *   { uri, mimeType: 'image/jpeg', name: 'photo.jpg' },
   *   { endpoint: '/media/upload', fields: { category: 'avatar' } }
   * )
   * // result.fileUrl → 'https://api.example.com/media/abc123.jpg'
   */
  function useDirectUpload(defaultOpts: DirectUploadOptions = {}) {
    const [isUploading, setIsUploading] = useState(false)
    const [progress, setProgress] = useState<UploadProgress | null>(null)
    const [result, setResult] = useState<UploadResult | null>(null)
    const [error, setError] = useState<Error | null>(null)

    const reset = useCallback(() => {
      setIsUploading(false)
      setProgress(null)
      setResult(null)
      setError(null)
    }, [])

    const upload = useCallback(
      async (file: UploadFile, callOpts: DirectUploadOptions = {}): Promise<UploadResult> => {
        const mergedOpts = { ...defaultOpts, ...callOpts }
        const endpoint = mergedOpts.endpoint ?? '/upload'
        // Prefer the call-site onProgress if provided, fall back to default.
        const onProgress = callOpts.onProgress ?? defaultOpts.onProgress

        setIsUploading(true)
        setProgress(null)
        setError(null)

        try {
          // Build multipart FormData.
          // React Native's FormData accepts { uri, type, name } for file blobs.
          const formData = new FormData()
          formData.append(
            'file',
            { uri: file.uri, type: file.mimeType, name: file.name } as unknown as Blob,
          )

          if (mergedOpts.fields) {
            for (const [key, value] of Object.entries(mergedOpts.fields)) {
              formData.append(key, value)
            }
          }

          // Fetch the auth token to attach to the XHR request.
          // The ApiClient handles token refresh via fetch(); for XHR we manually
          // attach the current token. An expired token will result in a 401 from
          // the server — callers should re-authenticate if that occurs.
          const token = await tokenStorage.getToken()
          const headers: Record<string, string> = {}
          if (token) headers['x-user-token'] = token

          const normalizedBase = baseUrl.replace(/\/$/, '')
          const { status, body: responseBody } = await uploadWithProgress(
            `${normalizedBase}${endpoint}`,
            formData,
            'POST',
            headers,
            (p) => {
              setProgress(p)
              onProgress?.(p)
            },
          )

          if (status >= 400) {
            throw new Error(`[pocketshot] Direct upload failed with status ${status}`)
          }

          let metadata: Record<string, unknown> | undefined
          try {
            metadata = JSON.parse(responseBody) as Record<string, unknown>
          } catch {
            // Non-JSON response body — metadata remains undefined.
          }

          const fileUrl =
            (metadata?.fileUrl as string | undefined) ??
            (metadata?.url as string | undefined) ??
            file.uri

          const uploadResult: UploadResult = { fileUrl, file, metadata }
          setResult(uploadResult)
          return uploadResult
        } catch (e) {
          const err = e instanceof Error ? e : new Error(String(e))
          setError(err)
          throw err
        } finally {
          setIsUploading(false)
        }
      },
      // eslint-disable-next-line react-hooks/exhaustive-deps
      [],
    )

    return { upload, progress, isUploading, result, error, reset }
  }

  return { usePresignedUpload, useDirectUpload }
}

/** Type of the object returned by {@link createUploadHooks}. */
export type UploadHooks = ReturnType<typeof createUploadHooks>
