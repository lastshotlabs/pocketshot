import { describe, expect, it, vi } from 'vitest'
import {
  AccountDataController,
  RelationshipPrivacyController,
  type AccountDataTransport,
} from '../../src/privacy'

function transport(): AccountDataTransport {
  return {
    requestExport: vi.fn(async () => ({ requestId: 'export-1' })),
    getExport: vi.fn(async () => ({
      status: 'ready' as const,
      downloadUrl: 'https://download.example.test/export.zip',
    })),
    requestDeletion: vi.fn(async () => ({
      requestId: 'delete-1',
      scheduledAt: '2026-08-01T00:00:00Z',
    })),
    cancelDeletion: vi.fn(async () => undefined),
    getDeletion: vi.fn(async () => ({ status: 'completed' as const })),
    revokeAuthorization: vi.fn(async () => undefined),
  }
}

describe('account data lifecycle', () => {
  it('requests and refreshes a data export', async () => {
    const controller = new AccountDataController(transport(), [])
    await controller.requestExport()
    await controller.requestExport()
    await controller.refreshExport()
    expect(controller.snapshot).toMatchObject({
      exportStatus: 'ready',
      exportRequestId: 'export-1',
      exportDownloadUrl: 'https://download.example.test/export.zip',
    })
  })

  it('cancels a scheduled deletion without clearing data', async () => {
    const api = transport()
    const clear = vi.fn()
    const controller = new AccountDataController(api, [{ name: 'database', clear }])
    await controller.requestDeletion()
    await controller.cancelDeletion()
    expect(controller.snapshot.deletionStatus).toBe('cancelled')
    expect(clear).not.toHaveBeenCalled()
  })

  it('revokes authorization and clears every local store after confirmed deletion', async () => {
    const api = transport()
    const database = vi.fn()
    const secureTokens = vi.fn()
    const controller = new AccountDataController(api, [
      { name: 'database', clear: database },
      { name: 'secure-tokens', clear: secureTokens },
    ])
    await controller.requestDeletion()
    await controller.refreshDeletion()
    expect(api.revokeAuthorization).toHaveBeenCalledOnce()
    expect(database).toHaveBeenCalledOnce()
    expect(secureTokens).toHaveBeenCalledOnce()
    expect(controller.snapshot).toMatchObject({
      deletionStatus: 'completed',
      authorizationRevoked: true,
      clearedStores: ['database', 'secure-tokens'],
      cleanupFailures: [],
    })
  })

  it('clears independent local stores even when revocation and another store fail, then retries', async () => {
    const api = transport()
    ;(api.revokeAuthorization as ReturnType<typeof vi.fn>)
      .mockRejectedValueOnce(new Error('private revoke detail'))
      .mockResolvedValue(undefined)
    const database = vi
      .fn()
      .mockRejectedValueOnce(new Error('private database path'))
      .mockResolvedValue(undefined)
    const secureTokens = vi.fn(async () => undefined)
    const controller = new AccountDataController(api, [
      { name: 'database', clear: database },
      { name: 'secure-tokens', clear: secureTokens },
    ])
    await controller.requestDeletion()
    await expect(controller.refreshDeletion()).rejects.toThrow('cleanup requires retry')
    expect(secureTokens).toHaveBeenCalledOnce()
    expect(controller.snapshot).toMatchObject({
      deletionStatus: 'cleanup-required',
      authorizationRevoked: false,
      clearedStores: ['secure-tokens'],
      cleanupFailures: ['authorization', 'database'],
      error: 'Error',
    })

    await controller.completeLocalCleanup()
    expect(controller.snapshot).toMatchObject({
      deletionStatus: 'completed',
      authorizationRevoked: true,
      clearedStores: ['database', 'secure-tokens'],
      cleanupFailures: [],
    })
    expect(secureTokens).toHaveBeenCalledOnce()
  })

  it('rejects insecure or credential-bearing export download URLs', async () => {
    const api = transport()
    ;(api.getExport as ReturnType<typeof vi.fn>).mockResolvedValue({
      status: 'ready',
      downloadUrl: 'http://user:password@download.example.test/export.zip',
    })
    const controller = new AccountDataController(api, [])
    await controller.requestExport()
    await expect(controller.refreshExport()).rejects.toThrow('credential-free HTTPS')
    expect(controller.snapshot.exportDownloadUrl).toBeNull()
  })
})

describe('relationship privacy', () => {
  it('blocks interaction and notifications while mute only suppresses notifications', () => {
    const privacy = new RelationshipPrivacyController()
    privacy.mute('quiet')
    privacy.block('blocked')
    expect(privacy.canInteract('quiet')).toBe(true)
    expect(privacy.shouldNotify('quiet')).toBe(false)
    expect(privacy.canInteract('blocked')).toBe(false)
    privacy.unblock('blocked')
    expect(privacy.canInteract('blocked')).toBe(true)
    expect(privacy.shouldNotify('blocked')).toBe(false)
  })

  it('restores and clears durable relationship preferences', () => {
    const first = new RelationshipPrivacyController()
    first.block('blocked')
    first.mute('quiet')
    const restored = new RelationshipPrivacyController()
    restored.restore(first.snapshot)
    expect(restored.snapshot).toEqual(first.snapshot)
    restored.clear()
    expect(restored.snapshot).toEqual({ blocked: [], muted: [] })
  })
})
