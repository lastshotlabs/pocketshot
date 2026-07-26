import type { AccessClaims, Permission, Role } from './types'

export interface AccessClaimsDocument extends AccessClaims {
  subjectId: string
  issuedAt: string
  expiresAt: string
}

export interface PermissionAuthority {
  fetch(): Promise<AccessClaimsDocument | null>
  authorize?(input: {
    subjectId: string
    permission: Permission
    resourceId?: string
  }): Promise<boolean>
}

export class PermissionController {
  private claims: AccessClaimsDocument | null = null
  private refreshRun: Promise<void> | null = null
  private errorValue: string | null = null

  constructor(
    private readonly authority: PermissionAuthority,
    private readonly now: () => number = Date.now,
  ) {}

  get snapshot(): {
    claims: AccessClaimsDocument | null
    status: 'unknown' | 'authorized' | 'unauthorized' | 'error'
    error: string | null
  } {
    const active = this.activeClaims()
    return {
      claims: active ? structuredClone(active) : null,
      status: this.errorValue ? 'error' : active ? 'authorized' : this.claims ? 'unauthorized' : 'unknown',
      error: this.errorValue,
    }
  }

  async refresh(): Promise<void> {
    if (this.refreshRun) return this.refreshRun
    this.refreshRun = this.performRefresh().finally(() => {
      this.refreshRun = null
    })
    return this.refreshRun
  }

  hasPermission(permission: Permission, requireAll: Permission[] = []): boolean {
    const claims = this.activeClaims()
    if (!claims || !permission.trim()) return false
    return claims.permissions.includes(permission) && requireAll.every((item) => claims.permissions.includes(item))
  }

  hasRole(role: Role, organizationId?: string): boolean {
    const claims = this.activeClaims()
    if (!claims || !role.trim()) return false
    return organizationId
      ? (claims.orgRoles?.[organizationId] ?? []).includes(role)
      : claims.roles.includes(role)
  }

  async authorize(permission: Permission, resourceId?: string): Promise<void> {
    const claims = this.activeClaims()
    if (!claims?.permissions.includes(permission)) throw new Error('Permission denied')
    if (this.authority.authorize) {
      const allowed = await this.authority.authorize({
        subjectId: claims.subjectId,
        permission,
        resourceId,
      })
      if (!allowed) {
        this.claims = null
        throw new Error('Permission authorization revoked')
      }
    }
  }

  clear(): void {
    this.claims = null
    this.errorValue = null
  }

  private async performRefresh(): Promise<void> {
    try {
      const claims = await this.authority.fetch()
      if (claims) validateClaims(claims)
      this.claims = claims ? structuredClone(claims) : null
      this.errorValue = null
    } catch (error) {
      this.claims = null
      this.errorValue = safePermissionError(error)
      throw error
    }
  }

  private activeClaims(): AccessClaimsDocument | null {
    if (!this.claims || Date.parse(this.claims.expiresAt) <= this.now()) return null
    return this.claims
  }
}

function validateClaims(claims: AccessClaimsDocument): void {
  if (
    !claims.subjectId.trim() ||
    !Number.isFinite(Date.parse(claims.issuedAt)) ||
    !Number.isFinite(Date.parse(claims.expiresAt)) ||
    Date.parse(claims.expiresAt) <= Date.parse(claims.issuedAt)
  ) {
    throw new Error('Access claims are invalid')
  }
  const collections = [
    claims.roles,
    claims.permissions,
    ...Object.values(claims.orgRoles ?? {}),
    ...Object.values(claims.orgPermissions ?? {}),
  ]
  if (collections.some((values) => values.some((value) => !value.trim()))) {
    throw new Error('Access claims contain an invalid grant')
  }
}

function safePermissionError(error: unknown): string {
  const value = error instanceof Error ? error.name : 'Authorization error'
  return value.slice(0, 80)
}
