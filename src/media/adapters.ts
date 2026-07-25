import type {
  MediaAsset,
  MediaCaptureAdapter,
  MediaPermissionResult,
  MediaPermissionState,
  MediaSource,
  MediaTransformAdapter,
} from './types'

interface PickerPermission {
  granted: boolean
  canAskAgain?: boolean
  status?: string
}

interface PickerAsset {
  uri: string
  fileName?: string | null
  mimeType?: string | null
  fileSize?: number | null
  type?: string | null
  width?: number
  height?: number
  duration?: number | null
}

export interface ExpoImagePickerLike {
  requestCameraPermissionsAsync(): Promise<PickerPermission>
  requestMediaLibraryPermissionsAsync(): Promise<PickerPermission>
  launchCameraAsync(options: Record<string, unknown>): Promise<{
    canceled: boolean
    assets?: PickerAsset[] | null
  }>
  launchImageLibraryAsync(options: Record<string, unknown>): Promise<{
    canceled: boolean
    assets?: PickerAsset[] | null
  }>
}

export function createExpoMediaCaptureAdapter(options: {
  imagePicker: ExpoImagePickerLike
  openSettings?: () => Promise<void>
  pickerOptions?: Record<string, unknown>
}): MediaCaptureAdapter {
  return {
    async requestPermission(source) {
      const response =
        source === 'camera'
          ? await options.imagePicker.requestCameraPermissionsAsync()
          : await options.imagePicker.requestMediaLibraryPermissionsAsync()
      const state = permissionState(response)
      return {
        state,
        canAskAgain: response.canAskAgain ?? state === 'denied',
        ...(state !== 'granted' && options.openSettings
          ? { openSettings: options.openSettings }
          : {}),
      } satisfies MediaPermissionResult
    },
    async acquire(source) {
      const pickerOptions = {
        mediaTypes: ['images', 'videos'],
        allowsEditing: false,
        ...options.pickerOptions,
      }
      const response =
        source === 'camera'
          ? await options.imagePicker.launchCameraAsync(pickerOptions)
          : await options.imagePicker.launchImageLibraryAsync(pickerOptions)
      const asset = response.assets?.[0]
      if (response.canceled || !asset) return null
      return normalizePickerAsset(asset)
    },
  }
}

export function createMediaTransformAdapter(
  transform: (
    asset: MediaAsset,
    options: { maxDimension?: number; quality?: number; normalizeOrientation: boolean },
  ) => Promise<MediaAsset>,
): MediaTransformAdapter {
  return { transform }
}

function normalizePickerAsset(asset: PickerAsset): MediaAsset {
  const kind = asset.type === 'video' || asset.mimeType?.startsWith('video/') ? 'video' : 'image'
  const extension = kind === 'video' ? 'mp4' : 'jpg'
  return {
    uri: asset.uri,
    name: asset.fileName ?? `capture.${extension}`,
    mimeType: asset.mimeType ?? (kind === 'video' ? 'video/mp4' : 'image/jpeg'),
    kind,
    size: asset.fileSize ?? 0,
    ...(asset.width === undefined ? {} : { width: asset.width }),
    ...(asset.height === undefined ? {} : { height: asset.height }),
    ...(asset.duration == null ? {} : { durationMs: asset.duration }),
  }
}

function permissionState(permission: PickerPermission): MediaPermissionState {
  if (permission.granted) return 'granted'
  if (permission.status === 'unavailable') return 'unavailable'
  if (permission.canAskAgain === false) return 'blocked'
  return 'denied'
}
