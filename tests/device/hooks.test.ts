import { describe, it, expect, vi, beforeEach } from 'vitest'

vi.mock('react-native', () => ({ Platform: { OS: 'ios' } }))
vi.mock('expo-device', () => ({
  brand: 'Apple',
  modelName: 'iPhone 15 Pro',
  osName: 'iOS',
  osVersion: '17.0',
  isDevice: true,
  deviceType: 1,
  totalMemory: 8_589_934_592,
  DeviceType: { PHONE: 1, TABLET: 2, DESKTOP: 3, TV: 4, UNKNOWN: 0 },
}))
vi.mock('expo-application', () => ({
  nativeAppVersion: '2.1.0',
  nativeBuildVersion: '42',
  applicationId: 'com.example.app',
}))
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
  it('returns device metadata from expo-device and expo-application', async () => {
    const info = await getDeviceInfo()
    expect(info.brand).toBe('Apple')
    expect(info.modelName).toBe('iPhone 15 Pro')
    expect(info.osName).toBe('iOS')
    expect(info.osVersion).toBe('17.0')
    expect(info.isDevice).toBe(true)
    expect(info.deviceType).toBe('PHONE')
    expect(info.appVersion).toBe('2.1.0')
    expect(info.buildVersion).toBe('42')
    expect(info.applicationId).toBe('com.example.app')
  })

  it('never throws', async () => {
    await expect(getDeviceInfo()).resolves.toBeDefined()
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
