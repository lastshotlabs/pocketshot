export interface OrgResponse {
  id: string
  name: string
  slug: string
  avatarUrl?: string
  description?: string
  plan?: string
  memberCount?: number
  createdAt: string
  updatedAt: string
}

export interface CreateOrgBody {
  name: string
  slug?: string
  description?: string
  avatarUrl?: string
}

export interface UpdateOrgBody {
  name?: string
  slug?: string
  description?: string
  avatarUrl?: string
}

export type OrgRole = 'owner' | 'admin' | 'member' | 'viewer'

export interface OrgMember {
  userId: string
  orgId: string
  role: OrgRole
  email?: string
  username?: string
  joinedAt: string
}

export interface InviteBody {
  email: string
  role?: OrgRole
}

export interface InviteResponse {
  inviteId: string
  email: string
  role: OrgRole
  orgId: string
  expiresAt: string
  status: 'pending' | 'accepted' | 'expired'
}

export interface UpdateMemberRoleBody {
  role: OrgRole
}

export interface OrgListParams {
  limit?: number
  offset?: number
}

export interface OrgMemberListParams {
  limit?: number
  offset?: number
  role?: OrgRole
}

export interface PaginatedOrgResponse<T> {
  items: T[]
  total: number
  limit: number
  offset: number
}
