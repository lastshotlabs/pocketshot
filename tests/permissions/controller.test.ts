import { describe, expect, it, vi } from 'vitest'
import { PermissionController } from '../../src/permissions'

describe('PermissionController', () => {
  it('fails closed on expiry, refresh failure, and server revocation', async () => {
    let now = Date.parse('2026-07-26T00:00:00Z')
    const authorize = vi.fn(async () => true)
    const authority = {
      fetch: vi.fn(async () => ({
        subjectId: 'person',
        issuedAt: '2026-07-26T00:00:00Z',
        expiresAt: '2026-07-27T00:00:00Z',
        roles: ['member'],
        permissions: ['thread:delete'],
      })),
      authorize,
    }
    const permissions = new PermissionController(authority, () => now)
    await permissions.refresh()
    expect(permissions.hasPermission('thread:delete')).toBe(true)
    await permissions.authorize('thread:delete', 'thread-1')
    authorize.mockResolvedValue(false)
    await expect(permissions.authorize('thread:delete')).rejects.toThrow('revoked')
    expect(permissions.hasPermission('thread:delete')).toBe(false)

    await permissions.refresh()
    now = Date.parse('2026-07-28T00:00:00Z')
    expect(permissions.hasPermission('thread:delete')).toBe(false)
    authority.fetch.mockRejectedValueOnce(new Error('Bearer secret'))
    await expect(permissions.refresh()).rejects.toThrow()
    expect(permissions.snapshot).toMatchObject({ status: 'error', claims: null, error: 'Error' })
  })
})
