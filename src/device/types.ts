/** Device hardware and software metadata. */
export interface DeviceInfo {
  /** Device brand (e.g. 'Apple', 'Samsung', 'Google'). Null if unavailable. */
  brand: string | null
  /** Device model name (e.g. 'iPhone 15 Pro', 'Pixel 8'). Null if unavailable. */
  modelName: string | null
  /** OS name (e.g. 'iOS', 'Android'). */
  osName: string | null
  /** OS version string (e.g. '17.0', '14'). */
  osVersion: string | null
  /** Whether this is a physical device (false = simulator/emulator). */
  isDevice: boolean
  /** Device type: 'PHONE', 'TABLET', 'DESKTOP', 'TV', 'UNKNOWN'. */
  deviceType: string
  /** Total device memory in bytes. Null if unavailable. */
  totalMemory: number | null
  /** App version string (e.g. '1.2.3'). Null if expo-application not installed. */
  appVersion: string | null
  /** App build number (e.g. '42'). Null if expo-application not installed. */
  buildVersion: string | null
  /** Native app bundle/package identifier. Null if expo-application not installed. */
  applicationId: string | null
}

/** Payload sent to the server to register or update this device. */
export interface DeviceRegistrationPayload {
  deviceId: string
  platform: 'ios' | 'android' | 'web'
  brand: string | null
  modelName: string | null
  osVersion: string | null
  appVersion: string | null
  buildVersion: string | null
  pushToken?: string
}

/** Server response after device registration. */
export interface DeviceRegistrationResponse {
  deviceId: string
  registered: boolean
  updatedAt: string
}
