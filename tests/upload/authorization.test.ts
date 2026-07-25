import { describe, expect, it } from 'vitest'
import { UploadAuthorizationController } from '../../src/upload/authorization'

const checksum = 'a'.repeat(64)
const file = {
  uri: 'file:///photo.jpg',
  name: 'photo.jpg',
  mimeType: 'image/jpeg',
  size: 1024,
}

describe('UploadAuthorizationController', () => {
  it('binds selection approval to server actor, destination, metadata, and checksum', () => {
    const controller = new UploadAuthorizationController(
      { allowedMimeTypes: ['image/jpeg'], maxBytes: 2048 },
      () => new Date('2026-07-25T12:00:00.000Z'),
      () => 'receipt-1',
    )
    const receipt = controller.authorizeSelection('alex', 'thread:42', file, checksum)
    expect(
      controller.acceptServerUpload(receipt, {
        actorId: 'alex',
        destination: 'thread:42',
        mimeType: 'image/jpeg',
        size: 1024,
        checksum,
        url: 'https://cdn.example.test/photo.jpg',
      }),
    ).toMatchObject({ receiptId: 'receipt-1', destination: 'thread:42' })
    expect(() =>
      controller.acceptServerUpload(receipt, {
        actorId: 'alex',
        destination: 'thread:42',
        mimeType: 'image/jpeg',
        size: 1024,
        checksum,
        url: 'https://cdn.example.test/photo.jpg',
      }),
    ).toThrow('already used')
  })

  it('rejects unsafe selection and mismatched or expired server acceptance', () => {
    let now = new Date('2026-07-25T12:00:00.000Z')
    const controller = new UploadAuthorizationController(
      { allowedMimeTypes: ['image/jpeg'], maxBytes: 2048, ttlMs: 1000 },
      () => now,
      () => 'receipt-1',
    )
    expect(() =>
      controller.authorizeSelection(
        'alex',
        'thread:42',
        { ...file, mimeType: 'text/html' },
        checksum,
      ),
    ).toThrow('Unsupported')
    const receipt = controller.authorizeSelection('alex', 'thread:42', file, checksum)
    expect(() =>
      controller.acceptServerUpload(receipt, {
        actorId: 'mallory',
        destination: 'thread:42',
        mimeType: 'image/jpeg',
        size: 1024,
        checksum,
        url: 'https://cdn.example.test/photo.jpg',
      }),
    ).toThrow('does not match')
    now = new Date('2026-07-25T12:00:02.000Z')
    expect(() =>
      controller.acceptServerUpload(receipt, {
        actorId: 'alex',
        destination: 'thread:42',
        mimeType: 'image/jpeg',
        size: 1024,
        checksum,
        url: 'https://cdn.example.test/photo.jpg',
      }),
    ).toThrow('expired')
  })
})
