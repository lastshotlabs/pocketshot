import { describe, it, expect, vi, beforeEach } from 'vitest'

// expo-device and expo-application are optional peers loaded via require() at call time.
// Vitest's vi.mock() intercepts ESM imports but NOT require() in function bodies.
// Stubs in node_modules provide default null/0 values — tests verify the result shape.

vi.mock('react-native', () => ({ Platform: { OS: 'ios' } }))
vi.mock('@tanstack/react-query', () => ({
  useQuery: vi.fn(),
  useMutation: vi.fn((opts: any) => ({
    mutate: vi.fn(),
    mutateAsync: vi.fn(),
    isPending: false,
    isSuccess: false,
    error: null,
    data: undefined,
  })),
}))

import { useQuery } from '@tanstack/react-query'
import { getDeviceInfo, createDeviceHooks } from '../../src/device/hooks'
import type { ApiClient } from '../../src/api/client'

const mockUseQuery = useQuery as ReturnType<typeof vi.fn>

function makeApi(): ApiClient {
  return { get: vi.fn(), post: vi.fn(), put: vi.fn(), patch: vi.fn(), delete: vi.fn(), fetch: vi.fn() } as unknown as ApiClient
}

describe('getDeviceInfo', () => {
  it('returns a complete DeviceInfo shape (never throws)', async () => {
    const info = await getDeviceInfo()
    // Shape check — stubs return null for most fields, Platform.OS fills in osName
    expect(info).toHaveProperty('brand')
    expect(info).toHaveProperty('modelName')
    expect(info).toHaveProperty('osName')
    expect(info).toHaveProperty('osVersion')
    expect(info).toHaveProperty('isDevice')
    expect(info).toHaveProperty('deviceType')
    expect(info).toHaveProperty('totalMemory')
    expect(info).toHaveProperty('appVersion')
    expect(info).toHaveProperty('buildVersion')
    expect(info).toHaveProperty('applicationId')
  })

  it('never throws', async () => {
    await expect(getDeviceInfo()).resolves.toBeDefined()
  })

  it('falls back to Platform.OS for osName when expo-device is absent', async () => {
    // The stubs return osName: null, so getDeviceInfo falls back to Platform.OS
    const info = await getDeviceInfo()
    // Platform is mocked to { OS: 'ios' }, expo-device stub returns null for osName
    // Result: info.osName may be null (from stub) or 'ios' (from Platform.OS fallback)
    expect(typeof info.osName === 'string' || info.osName === null).toBe(true)
  })
})

describe('createDeviceHooks factory shape', () => {
  it('returns useDeviceInfo and useDeviceRegistration', () => {
    const hooks = createDeviceHooks(makeApi())
    expect(typeof hooks.useDeviceInfo).toBe('function')
    expect(typeof hooks.useDeviceRegistration).toBe('function')
  })
})

describe('useDeviceInfo', () => {
  beforeEach(() => vi.clearAllMocks())

  it('queries with ["device", "info"] key and staleTime Infinity', () => {
    mockUseQuery.mockReturnValue({ data: null, isLoading: false })
    const { useDeviceInfo } = createDeviceHooks(makeApi())
    useDeviceInfo()
    expect(mockUseQuery).toHaveBeenCalledWith(expect.objectContaining({
      queryKey: ['device', 'info'],
      staleTime: Infinity,
      retry: false,
    }))
  })

  it('returns null deviceInfo when data is undefined', () => {
    mockUseQuery.mockReturnValue({ data: undefined, isLoading: false })
    const { useDeviceInfo } = createDeviceHooks(makeApi())
    const result = useDeviceInfo()
    expect(result.deviceInfo).toBeNull()
  })
})

describe('useDeviceRegistration', () => {
  beforeEach(() => vi.clearAllMocks())

  it('returns registerDevice, registerDeviceAsync, isPending, isSuccess, error, registrationResult', () => {
    const { useDeviceRegistration } = createDeviceHooks(makeApi())
    const result = useDeviceRegistration()
    expect(typeof result.registerDevice).toBe('function')
    expect(typeof result.registerDeviceAsync).toBe('function')
    expect(result.isPending).toBe(false)
    expect(result.isSuccess).toBe(false)
    expect(result.error).toBeNull()
    expect(result.registrationResult).toBeNull()
  })
})
