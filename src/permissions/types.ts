/** A named permission string, e.g. 'community:thread:create' */
export type Permission = string

/** A named role string, e.g. 'admin', 'moderator', 'member' */
export type Role = string

/** The full set of access claims for the current user. */
export interface AccessClaims {
  /** User's roles in the current context (app-wide or org-scoped). */
  roles: Role[]
  /** Explicit permission grants. */
  permissions: Permission[]
  /** Org-scoped roles: orgId → roles */
  orgRoles?: Record<string, Role[]>
  /** Org-scoped permissions: orgId → permissions */
  orgPermissions?: Record<string, Permission[]>
}

/** Options for permission checks. */
export interface PermissionCheckOptions {
  /** Require ALL listed permissions (default: false = any one is sufficient). */
  requireAll?: boolean
}

/** Options for org-scoped permission checks. */
export interface OrgPermissionCheckOptions extends PermissionCheckOptions {
  /** The org context to check permissions within. */
  orgId: string
}
