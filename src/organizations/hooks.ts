import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import type { ApiClient } from '../api/client'
import { defaultOrgContract } from './contract'
import type {
  OrgResponse,
  CreateOrgBody,
  UpdateOrgBody,
  OrgMember,
  InviteBody,
  InviteResponse,
  UpdateMemberRoleBody,
  OrgListParams,
  OrgMemberListParams,
  PaginatedOrgResponse,
} from './types'

// ── Cache key helpers ──────────────────────────────────────────────────────────

const keys = {
  orgs: () => ['orgs'] as const,
  org: (orgId: string) => ['orgs', orgId] as const,
  members: (orgId: string) => ['orgs', orgId, 'members'] as const,
  invites: (orgId: string) => ['orgs', orgId, 'invites'] as const,
}

// ── Query string builder ──────────────────────────────────────────────────────

function buildOrgListQuery(params?: OrgListParams): string {
  if (!params) return ''
  const qs = new URLSearchParams()
  if (params.limit !== undefined) qs.set('limit', String(params.limit))
  if (params.offset !== undefined) qs.set('offset', String(params.offset))
  const str = qs.toString()
  return str ? `?${str}` : ''
}

function buildMemberListQuery(params?: OrgMemberListParams): string {
  if (!params) return ''
  const qs = new URLSearchParams()
  if (params.limit !== undefined) qs.set('limit', String(params.limit))
  if (params.offset !== undefined) qs.set('offset', String(params.offset))
  if (params.role) qs.set('role', params.role)
  const str = qs.toString()
  return str ? `?${str}` : ''
}

// ── Factory ───────────────────────────────────────────────────────────────────

export function createOrgHooks(api: ApiClient) {
  const contract = defaultOrgContract()

  // ── Organizations ─────────────────────────────────────────────────────────

  /**
   * List all organizations the current user belongs to.
   * Supports optional pagination via `limit` and `offset`.
   */
  function useOrganizations(params?: OrgListParams) {
    const query = buildOrgListQuery(params)
    return useQuery<PaginatedOrgResponse<OrgResponse>>({
      queryKey: [...keys.orgs(), params] as const,
      queryFn: () => api.get<PaginatedOrgResponse<OrgResponse>>(`${contract.list}${query}`),
    })
  }

  /**
   * Fetch a single organization by ID.
   * Query is disabled when `orgId` is empty.
   */
  function useOrganization(orgId: string) {
    return useQuery<OrgResponse>({
      queryKey: keys.org(orgId),
      queryFn: () => api.get<OrgResponse>(contract.get(orgId)),
      enabled: !!orgId,
    })
  }

  /**
   * Create a new organization.
   * On success, invalidates the organizations list.
   */
  function useCreateOrganization() {
    const queryClient = useQueryClient()
    return useMutation<OrgResponse, Error, CreateOrgBody>({
      mutationFn: (body) => api.post<OrgResponse>(contract.create, body),
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: keys.orgs() })
      },
    })
  }

  /**
   * Update an existing organization.
   * On success, invalidates both the org detail and the list.
   */
  function useUpdateOrganization(orgId: string) {
    const queryClient = useQueryClient()
    return useMutation<OrgResponse, Error, UpdateOrgBody>({
      mutationFn: (body) => api.patch<OrgResponse>(contract.update(orgId), body),
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: keys.org(orgId) })
        queryClient.invalidateQueries({ queryKey: keys.orgs() })
      },
    })
  }

  /**
   * Delete an organization.
   * On success, invalidates the organizations list.
   */
  function useDeleteOrganization(orgId: string) {
    const queryClient = useQueryClient()
    return useMutation<void, Error, void>({
      mutationFn: () => api.delete<void>(contract.delete(orgId)),
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: keys.orgs() })
      },
    })
  }

  // ── Members ───────────────────────────────────────────────────────────────

  /**
   * List members of an organization.
   * Supports filtering by `role` and pagination via `limit` and `offset`.
   * Query is disabled when `orgId` is empty.
   */
  function useOrgMembers(orgId: string, params?: OrgMemberListParams) {
    const query = buildMemberListQuery(params)
    return useQuery<PaginatedOrgResponse<OrgMember>>({
      queryKey: [...keys.members(orgId), params] as const,
      queryFn: () => api.get<PaginatedOrgResponse<OrgMember>>(`${contract.members(orgId)}${query}`),
      enabled: !!orgId,
    })
  }

  /**
   * Invite a user to the organization by email.
   * On success, invalidates the org's invites list.
   */
  function useInviteMember(orgId: string) {
    const queryClient = useQueryClient()
    return useMutation<InviteResponse, Error, InviteBody>({
      mutationFn: (body) => api.post<InviteResponse>(contract.invite(orgId), body),
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: keys.invites(orgId) })
      },
    })
  }

  /**
   * Revoke a pending invite.
   * On success, invalidates the org's invites list.
   */
  function useRevokeInvite(orgId: string) {
    const queryClient = useQueryClient()
    return useMutation<void, Error, { inviteId: string }>({
      mutationFn: ({ inviteId }) => api.delete<void>(contract.revokeInvite(orgId, inviteId)),
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: keys.invites(orgId) })
      },
    })
  }

  /**
   * List all pending invites for an organization.
   * Query is disabled when `orgId` is empty.
   */
  function useOrgInvites(orgId: string) {
    return useQuery<PaginatedOrgResponse<InviteResponse>>({
      queryKey: keys.invites(orgId),
      queryFn: () => api.get<PaginatedOrgResponse<InviteResponse>>(contract.invites(orgId)),
      enabled: !!orgId,
    })
  }

  /**
   * Remove a member from the organization.
   * On success, invalidates the org's member list.
   */
  function useRemoveMember(orgId: string) {
    const queryClient = useQueryClient()
    return useMutation<void, Error, { userId: string }>({
      mutationFn: ({ userId }) => api.delete<void>(contract.member(orgId, userId)),
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: keys.members(orgId) })
      },
    })
  }

  /**
   * Update the role of an existing org member.
   * On success, invalidates the org's member list.
   */
  function useUpdateMemberRole(orgId: string) {
    const queryClient = useQueryClient()
    return useMutation<OrgMember, Error, { userId: string } & UpdateMemberRoleBody>({
      mutationFn: ({ userId, ...body }) =>
        api.patch<OrgMember>(contract.member(orgId, userId), body),
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: keys.members(orgId) })
      },
    })
  }

  /**
   * Leave an organization as the current user.
   * On success, invalidates the organizations list.
   */
  function useLeaveOrganization(orgId: string) {
    const queryClient = useQueryClient()
    return useMutation<void, Error, void>({
      mutationFn: () => api.post<void>(contract.leave(orgId), {}),
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: keys.orgs() })
      },
    })
  }

  // ── Return all hooks ──────────────────────────────────────────────────────

  return {
    // Organizations
    useOrganizations,
    useOrganization,
    useCreateOrganization,
    useUpdateOrganization,
    useDeleteOrganization,
    // Members
    useOrgMembers,
    useInviteMember,
    useRevokeInvite,
    useOrgInvites,
    useRemoveMember,
    useUpdateMemberRole,
    useLeaveOrganization,
  }
}

export type OrgHooks = ReturnType<typeof createOrgHooks>
