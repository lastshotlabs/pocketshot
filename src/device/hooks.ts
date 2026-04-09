import { useQuery, useMutation } from '@tanstack/react-query'
import { Platform } from 'react-native'
import type { ApiClient } from '../api/client'
import type { DeviceInfo, DeviceRegistrationPayload, DeviceRegistrationResponse } from './types'

// ── Optional peer dep loaders ─────────────────────────────────────────────────

function tryLoadDevice() {
  try {
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    return require('expo-device') as {
      brand: string | null
      modelName: string | null
      osName: string | null
      osVersion: string | null
      isDevice: boolean
      deviceType: number | null
      totalMemory: number | null
      DeviceType: Record<string, number>
    }
  } catch {
    return null
  }
}

function tryLoadApplication() {
  try {
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    return require('expo-application') as {
      nativeAppVersion: string | null
      nativeBuildVersion: string | null
      applicationId: string | null
    }
  } catch {
    return null
  }
}

// ── Device type name resolution ───────────────────────────────────────────────

function resolveDeviceType(Device: ReturnType<typeof tryLoadDevice>): string {
  if (!Device) return 'UNKNOWN'
  const { deviceType, DeviceType } = Device
  if (deviceType === null) return 'UNKNOWN'
  const entries = Object.entries(DeviceType) as [string, number][]
  const match = entries.find(([, v]) => v === deviceType)
  return match?.[0] ?? 'UNKNOWN'
}

// ── getDeviceInfo — standalone async utility ──────────────────────────────────

/**
 * Collects device metadata from expo-device and expo-application.
 * If either optional peer is not installed, the affected fields return null.
 * Never throws — always returns a complete DeviceInfo object.
 */
export async function getDeviceInfo(): Promise<DeviceInfo> {
  const Device = tryLoadDevice()
  const App = tryLoadApplication()

  return {
    brand: Device?.brand ?? null,
    modelName: Device?.modelName ?? null,
    osName: Device?.osName ?? Platform.OS ?? null,
    osVersion: Device?.osVersion ?? null,
    isDevice: Device?.isDevice ?? true,
    deviceType: resolveDeviceType(Device),
    totalMemory: Device?.totalMemory ?? null,
    appVersion: App?.nativeAppVersion ?? null,
    buildVersion: App?.nativeBuildVersion ?? null,
    applicationId: App?.applicationId ?? null,
  }
}

// ── Factory ───────────────────────────────────────────────────────────────────

/**
 * Creates device hooks bound to the provided API client.
 * Called once inside createPocketshot().
 */
export function createDeviceHooks(api: ApiClient) {
  /**
   * Queries device metadata and returns it as React state.
   * Reads from expo-device and expo-application (both optional).
   *
   * @example
   * const { deviceInfo, isLoading } = useDeviceInfo()
   * console.log(deviceInfo?.modelName) // 'iPhone 15 Pro'
   */
  function useDeviceInfo() {
    const { data: deviceInfo = null, isLoading } = useQuery<DeviceInfo | null>({
      queryKey: ['device', 'info'],
      queryFn: getDeviceInfo,
      staleTime: Infinity, // device info doesn't change during app session
      retry: false,
    })
    return { deviceInfo, isLoading }
  }

  /**
   * Mutation to register or update this device on the backend.
   * Sends device metadata and an optional push token to the server.
   *
   * The endpoint is `POST /device/register` — override via contract if needed.
   *
   * @example
   * const { registerDevice } = useDeviceRegistration()
   * await registerDevice({ deviceId: myDeviceId, pushToken: expoPushToken })
   */
  function useDeviceRegistration() {
    const mutation = useMutation<
      DeviceRegistrationResponse,
      Error,
      { pushToken?: string; deviceId: string }
    >({
      mutationFn: async ({ pushToken, deviceId }) => {
        const info = await getDeviceInfo()
        const payload: DeviceRegistrationPayload = {
          deviceId,
          platform: Platform.OS === 'ios' ? 'ios' : Platform.OS === 'android' ? 'android' : 'web',
          brand: info.brand,
          modelName: info.modelName,
          osVersion: info.osVersion,
          appVersion: info.appVersion,
          buildVersion: info.buildVersion,
          pushToken,
        }
        return api.post<DeviceRegistrationResponse>('/device/register', payload)
      },
    })

    return {
      registerDevice: mutation.mutate,
      registerDeviceAsync: mutation.mutateAsync,
      isPending: mutation.isPending,
      isSuccess: mutation.isSuccess,
      error: mutation.error,
      registrationResult: mutation.data ?? null,
    }
  }

  return { useDeviceInfo, useDeviceRegistration }
}

export type DeviceHooks = ReturnType<typeof createDeviceHooks>
