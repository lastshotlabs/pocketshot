import { useQuery } from '@tanstack/react-query'
import { useCallback } from 'react'
import type { ApiClient } from '../api/client'
import type {
  AccessClaims,
  Permission,
  Role,
  PermissionCheckOptions,
  OrgPermissionCheckOptions,
} from './types'

const PERMISSIONS_QUERY_KEY = ['auth', 'permissions'] as const

export function createPermissionHooks(api: ApiClient, opts?: { endpoint?: string }) {
  const endpoint = opts?.endpoint ?? '/auth/permissions'

  /**
   * Fetches and caches the current user's access claims (roles + permissions).
   * Returns null when the user is not authenticated.
   */
  function useAccessClaims(): { claims: AccessClaims | null; isLoading: boolean } {
    const { data: claims = null, isLoading } = useQuery<AccessClaims | null>({
      queryKey: PERMISSIONS_QUERY_KEY,
      queryFn: async () => {
        try {
          return await api.get<AccessClaims>(endpoint)
        } catch {
          return null
        }
      },
      staleTime: 300_000,
      retry: false,
    })
    return { claims, isLoading }
  }

  /**
   * Returns true if the current user has the specified role(s).
   * With multiple roles, any one match returns true (OR logic).
   */
  function useHasRole(...roles: Role[]): boolean {
    const { claims } = useAccessClaims()
    if (!claims) return false
    return roles.some((role) => claims.roles.includes(role))
  }

  /**
   * Returns true if the current user has the specified permission(s).
   * Use `requireAll: true` to require ALL permissions (AND logic).
   */
  function useHasPermission(
    permissions: Permission | Permission[],
    checkOpts?: PermissionCheckOptions,
  ): boolean {
    const { claims } = useAccessClaims()
    if (!claims) return false
    const list = Array.isArray(permissions) ? permissions : [permissions]
    if (checkOpts?.requireAll) {
      return list.every((p) => claims.permissions.includes(p))
    }
    return list.some((p) => claims.permissions.includes(p))
  }

  /**
   * Returns true if the user has the role within a specific org.
   */
  function useHasOrgRole(orgId: string, ...roles: Role[]): boolean {
    const { claims } = useAccessClaims()
    if (!claims) return false
    const orgRoles = claims.orgRoles?.[orgId] ?? []
    return roles.some((role) => orgRoles.includes(role))
  }

  /**
   * Returns true if the user has the permission within a specific org.
   */
  function useHasOrgPermission(
    permissions: Permission | Permission[],
    checkOpts: OrgPermissionCheckOptions,
  ): boolean {
    const { claims } = useAccessClaims()
    if (!claims) return false
    const { orgId, requireAll } = checkOpts
    const orgPerms = claims.orgPermissions?.[orgId] ?? []
    const list = Array.isArray(permissions) ? permissions : [permissions]
    if (requireAll) {
      return list.every((p) => orgPerms.includes(p))
    }
    return list.some((p) => orgPerms.includes(p))
  }

  /**
   * Returns a function that checks a permission synchronously given claims.
   * Useful for imperative checks outside of render (e.g. in event handlers).
   *
   * @example
   * const can = usePermissionChecker()
   * if (can('community:thread:delete')) deleteThread(id)
   */
  function usePermissionChecker(): (permission: Permission) => boolean {
    const { claims } = useAccessClaims()
    return useCallback(
      (permission: Permission) => {
        if (!claims) return false
        return claims.permissions.includes(permission)
      },
      [claims],
    )
  }

  /**
   * Guards a callback: only executes it if the user has the required permission.
   * Otherwise calls `onDenied` (defaults to a console.warn).
   */
  function usePermissionGuard<TArgs extends unknown[]>(
    permission: Permission,
    callback: (...args: TArgs) => void | Promise<void>,
    onDenied?: () => void,
  ): (...args: TArgs) => void {
    const { claims } = useAccessClaims()
    return useCallback(
      (...args: TArgs) => {
        const allowed = claims?.permissions.includes(permission) ?? false
        if (!allowed) {
          if (onDenied) {
            onDenied()
          } else {
            console.warn(
              `[pocketshot] Permission denied: '${permission}'. User does not have the required permission.`,
            )
          }
          return
        }
        void callback(...args)
      },
      // eslint-disable-next-line react-hooks/exhaustive-deps
      [claims, permission, callback, onDenied],
    )
  }

  return {
    useAccessClaims,
    useHasRole,
    useHasPermission,
    useHasOrgRole,
    useHasOrgPermission,
    usePermissionChecker,
    usePermissionGuard,
  }
}

export type PermissionHooks = ReturnType<typeof createPermissionHooks>
