import { describe, expect, it, vi } from 'vitest'
import { createExpoMediaCaptureAdapter } from '../../src/media'

describe('createExpoMediaCaptureAdapter', () => {
  it('maps iOS/Android picker metadata and blocked permission recovery', async () => {
    const openSettings = vi.fn(async () => undefined)
    const picker = {
      requestCameraPermissionsAsync: vi.fn(async () => ({
        granted: false,
        canAskAgain: false,
      })),
      requestMediaLibraryPermissionsAsync: vi.fn(async () => ({
        granted: true,
      })),
      launchCameraAsync: vi.fn(),
      launchImageLibraryAsync: vi.fn(async () => ({
        canceled: false,
        assets: [
          {
            uri: 'file:///clip.mp4',
            fileName: 'clip.mp4',
            mimeType: 'video/mp4',
            fileSize: 42,
            type: 'video' as const,
            width: 1920,
            height: 1080,
            duration: 2_000,
          },
        ],
      })),
    }
    const capture = createExpoMediaCaptureAdapter({ imagePicker: picker, openSettings })

    const permission = await capture.requestPermission('camera')
    const asset = await capture.acquire('library')

    expect(permission).toMatchObject({ state: 'blocked', canAskAgain: false })
    await permission.openSettings?.()
    expect(openSettings).toHaveBeenCalled()
    expect(asset).toMatchObject({
      kind: 'video',
      size: 42,
      durationMs: 2_000,
      width: 1920,
      height: 1080,
    })
  })
})
