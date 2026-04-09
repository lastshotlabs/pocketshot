import { describe, it, expect, vi, beforeEach } from 'vitest'

vi.mock('react', async (importOriginal) => {
  const actual = await importOriginal<typeof import('react')>()
  return {
    ...actual,
    useState: vi.fn((initial: unknown) => [initial, vi.fn()]),
    useCallback: (fn: unknown) => fn,
  }
})

import { createUploadHooks } from '../../src/upload/hooks'
import type { ApiClient } from '../../src/api/client'
import type { TokenStorage } from '../../src/auth/storage'

function makeApi(): ApiClient {
  return {
    get: vi.fn(),
    post: vi.fn(),
    put: vi.fn(),
    patch: vi.fn(),
    delete: vi.fn(),
    fetch: vi.fn(),
  } as unknown as ApiClient
}

function makeStorage(): TokenStorage {
  return {
    getToken: vi.fn().mockResolvedValue('test-token'),
    setToken: vi.fn(),
    clearToken: vi.fn(),
    getRefreshToken: vi.fn().mockResolvedValue(null),
    setRefreshToken: vi.fn(),
    clearRefreshToken: vi.fn(),
  }
}

describe('createUploadHooks factory shape', () => {
  it('returns usePresignedUpload and useDirectUpload', () => {
    const hooks = createUploadHooks(makeApi(), {
      baseUrl: 'https://api.example.com',
      tokenStorage: makeStorage(),
    })
    expect(typeof hooks.usePresignedUpload).toBe('function')
    expect(typeof hooks.useDirectUpload).toBe('function')
  })
})

describe('usePresignedUpload', () => {
  beforeEach(() => vi.clearAllMocks())

  it('returns upload function, progress, isUploading, result, error, reset', () => {
    const hooks = createUploadHooks(makeApi(), {
      baseUrl: 'https://api.example.com',
      tokenStorage: makeStorage(),
    })
    const result = hooks.usePresignedUpload()
    expect(typeof result.upload).toBe('function')
    expect(typeof result.reset).toBe('function')
    expect(result.progress).toBeNull()
    expect(result.isUploading).toBe(false)
    expect(result.result).toBeNull()
    expect(result.error).toBeNull()
  })

  it('calls api.post with the presign endpoint to get upload URL', async () => {
    const api = makeApi()
    // Mock presign response — resolves immediately
    ;(api.post as ReturnType<typeof vi.fn>).mockResolvedValue({
      uploadUrl: 'https://storage.example.com/upload/123',
      fileUrl: 'https://cdn.example.com/file/123',
    })

    // Mock XHR globally for the upload step
    const mockXhr = {
      open: vi.fn(),
      setRequestHeader: vi.fn(),
      send: vi.fn(),
      upload: { onprogress: null as unknown },
      onload: null as unknown,
      onerror: null as unknown,
      ontimeout: null as unknown,
      status: 200,
      responseText: '',
    }
    ;(globalThis as any).XMLHttpRequest = vi.fn(() => mockXhr)

    const hooks = createUploadHooks(api, {
      baseUrl: 'https://api.example.com',
      tokenStorage: makeStorage(),
    })
    const { upload } = hooks.usePresignedUpload()

    // api.post is called synchronously before the first await in the upload function
    upload(
      { uri: 'file:///photo.jpg', mimeType: 'image/jpeg', name: 'photo.jpg' },
      { presignEndpoint: '/files/presign' },
    ).catch(() => {}) // XHR mock won't fire onload — ignore rejection

    expect(api.post).toHaveBeenCalledWith(
      '/files/presign',
      expect.objectContaining({ mimeType: 'image/jpeg', fileName: 'photo.jpg' }),
    )
  })
})

describe('useDirectUpload', () => {
  beforeEach(() => vi.clearAllMocks())

  it('returns upload, progress, isUploading, result, error, reset', () => {
    const hooks = createUploadHooks(makeApi(), {
      baseUrl: 'https://api.example.com',
      tokenStorage: makeStorage(),
    })
    const result = hooks.useDirectUpload()
    expect(typeof result.upload).toBe('function')
    expect(typeof result.reset).toBe('function')
    expect(result.isUploading).toBe(false)
  })

  it('sends a multipart FormData request to the upload endpoint', async () => {
    const mockXhr = {
      open: vi.fn(),
      setRequestHeader: vi.fn(),
      send: vi.fn(),
      upload: { onprogress: null as unknown },
      onload: null as unknown,
      onerror: null as unknown,
      ontimeout: null as unknown,
      status: 200,
      responseText: JSON.stringify({ id: 'file-1', url: 'https://cdn.example.com/file/1' }),
    }
    ;(globalThis as any).XMLHttpRequest = vi.fn(() => mockXhr)
    ;(globalThis as any).FormData = class {
      private _data: Record<string, unknown> = {}
      append(key: string, value: unknown) {
        this._data[key] = value
      }
    }

    const hooks = createUploadHooks(makeApi(), {
      baseUrl: 'https://api.example.com',
      tokenStorage: makeStorage(),
    })
    const { upload } = hooks.useDirectUpload()

    // Start upload without awaiting — let it run until XHR is invoked
    upload(
      { uri: 'file:///photo.jpg', mimeType: 'image/jpeg', name: 'photo.jpg' },
      { endpoint: '/files/upload' },
    ).catch(() => {})

    // Flush one microtask cycle so tokenStorage.getToken() resolves and XHR.open is called
    await Promise.resolve()

    expect(mockXhr.open).toHaveBeenCalledWith('POST', 'https://api.example.com/files/upload')
  })
})
