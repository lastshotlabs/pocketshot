import type { UploadFile } from './types'

export interface UploadAuthorizationPolicy {
  allowedMimeTypes: readonly string[]
  maxBytes: number
  ttlMs?: number
}

export interface UploadAuthorizationReceipt {
  id: string
  actorId: string
  destination: string
  fileName: string
  mimeType: string
  size: number
  checksum: string
  expiresAt: string
}

export interface AcceptedUpload {
  receiptId: string
  url: string
  actorId: string
  destination: string
  mimeType: string
  size: number
}

export class UploadAuthorizationController {
  private readonly consumed = new Set<string>()
  private readonly issued = new Map<string, UploadAuthorizationReceipt>()

  constructor(
    private readonly policy: UploadAuthorizationPolicy,
    private readonly now: () => Date = () => new Date(),
    private readonly createId: () => string = () => crypto.randomUUID(),
  ) {
    if (
      policy.allowedMimeTypes.length === 0 ||
      !Number.isFinite(policy.maxBytes) ||
      policy.maxBytes <= 0 ||
      (policy.ttlMs !== undefined && (!Number.isFinite(policy.ttlMs) || policy.ttlMs <= 0))
    ) {
      throw new RangeError('[pocketshot] Upload authorization policy is invalid')
    }
  }

  authorizeSelection(
    actorId: string,
    destination: string,
    file: UploadFile & { size: number },
    checksum: string,
  ): UploadAuthorizationReceipt {
    this.validateIdentity(actorId, destination)
    this.validateFile(file)
    if (!/^[a-f0-9]{64}$/i.test(checksum)) {
      throw new Error('[pocketshot] Upload checksum must be a SHA-256 hex digest')
    }
    const receipt: UploadAuthorizationReceipt = {
      id: this.createId(),
      actorId,
      destination,
      fileName: file.name,
      mimeType: file.mimeType,
      size: file.size,
      checksum: checksum.toLowerCase(),
      expiresAt: new Date(this.now().getTime() + (this.policy.ttlMs ?? 300_000)).toISOString(),
    }
    if (!receipt.id || this.issued.has(receipt.id) || this.consumed.has(receipt.id)) {
      throw new Error('[pocketshot] Upload receipt ID must be unique')
    }
    this.issued.set(receipt.id, { ...receipt })
    return receipt
  }

  acceptServerUpload(
    receipt: UploadAuthorizationReceipt,
    uploaded: {
      actorId: string
      destination: string
      mimeType: string
      size: number
      checksum: string
      url: string
    },
  ): AcceptedUpload {
    if (this.consumed.has(receipt.id))
      throw new Error('[pocketshot] Upload receipt was already used')
    const issued = this.issued.get(receipt.id)
    if (!issued || !sameReceipt(issued, receipt)) {
      throw new Error('[pocketshot] Upload receipt was not issued or was modified')
    }
    if (new Date(receipt.expiresAt).getTime() <= this.now().getTime()) {
      throw new Error('[pocketshot] Upload authorization expired')
    }
    this.validateIdentity(uploaded.actorId, uploaded.destination)
    this.validateFile({
      name: receipt.fileName,
      mimeType: uploaded.mimeType,
      size: uploaded.size,
    })
    if (
      receipt.actorId !== uploaded.actorId ||
      receipt.destination !== uploaded.destination ||
      receipt.mimeType !== uploaded.mimeType ||
      receipt.size !== uploaded.size ||
      receipt.checksum !== uploaded.checksum.toLowerCase()
    ) {
      throw new Error('[pocketshot] Uploaded file does not match its authorization')
    }
    const url = new URL(uploaded.url)
    if (url.protocol !== 'https:')
      throw new Error('[pocketshot] Accepted upload URL must use HTTPS')
    if (url.username || url.password) {
      throw new Error('[pocketshot] Accepted upload URL must not contain credentials')
    }
    this.consumed.add(receipt.id)
    this.issued.delete(receipt.id)
    return {
      receiptId: receipt.id,
      url: url.toString(),
      actorId: uploaded.actorId,
      destination: uploaded.destination,
      mimeType: uploaded.mimeType,
      size: uploaded.size,
    }
  }

  private validateIdentity(actorId: string, destination: string): void {
    if (!actorId.trim() || !destination.trim()) {
      throw new Error('[pocketshot] Upload actor and destination are required')
    }
  }

  private validateFile(file: Pick<UploadFile, 'mimeType' | 'name'> & { size: number }): void {
    if (!file.name.trim()) throw new Error('[pocketshot] Upload file name is required')
    if (
      file.name.includes('/') ||
      file.name.includes('\\') ||
      /[\u0000-\u001f\u007f]/.test(file.name)
    ) {
      throw new Error('[pocketshot] Upload file name must not contain paths or control characters')
    }
    if (!this.policy.allowedMimeTypes.includes(file.mimeType)) {
      throw new Error(`[pocketshot] Unsupported upload type: ${file.mimeType}`)
    }
    if (!Number.isFinite(file.size) || file.size <= 0 || file.size > this.policy.maxBytes) {
      throw new Error(
        `[pocketshot] Upload size must be between 1 and ${this.policy.maxBytes} bytes`,
      )
    }
  }
}

function sameReceipt(
  left: UploadAuthorizationReceipt,
  right: UploadAuthorizationReceipt,
): boolean {
  return (
    left.id === right.id &&
    left.actorId === right.actorId &&
    left.destination === right.destination &&
    left.fileName === right.fileName &&
    left.mimeType === right.mimeType &&
    left.size === right.size &&
    left.checksum === right.checksum &&
    left.expiresAt === right.expiresAt
  )
}
