export interface OrgContract {
  list: string
  create: string
  get: (orgId: string) => string
  update: (orgId: string) => string
  delete: (orgId: string) => string
  members: (orgId: string) => string
  member: (orgId: string, userId: string) => string
  invite: (orgId: string) => string
  invites: (orgId: string) => string
  revokeInvite: (orgId: string, inviteId: string) => string
  leave: (orgId: string) => string
}

export function defaultOrgContract(): OrgContract {
  return {
    list: '/orgs',
    create: '/orgs',
    get: (orgId) => `/orgs/${orgId}`,
    update: (orgId) => `/orgs/${orgId}`,
    delete: (orgId) => `/orgs/${orgId}`,
    members: (orgId) => `/orgs/${orgId}/members`,
    member: (orgId, userId) => `/orgs/${orgId}/members/${userId}`,
    invite: (orgId) => `/orgs/${orgId}/invites`,
    invites: (orgId) => `/orgs/${orgId}/invites`,
    revokeInvite: (orgId, inviteId) => `/orgs/${orgId}/invites/${inviteId}`,
    leave: (orgId) => `/orgs/${orgId}/leave`,
  }
}
