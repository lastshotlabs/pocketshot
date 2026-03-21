import type { PocketshotScaffoldConfig } from '../../types'

export function libPocketshotTemplate(config: PocketshotScaffoldConfig): string {
  const imports = [`import { createPocketshot } from '@lastshotlabs/pocketshot'`]
  const configImports: string[] = [`API_BASE_URL`]
  if (config.webSocket) configImports.push(`WS_ENDPOINT`)
  imports.push(`import { ${configImports.join(', ')} } from './config'`)

  const createArgs: Record<string, string> = { apiUrl: 'API_BASE_URL' }
  if (config.webSocket) createArgs.wsEndpoint = 'WS_ENDPOINT'
  const createArgsStr = Object.entries(createArgs).map(([k, v]) => `${k}: ${v}`).join(', ')

  // Build destructure list based on config
  const hooks = [
    'useUser', 'useLogin', 'useRegister', 'useLogout',
    'useVerifyMfa', 'useExchangeOAuthCode',
  ]
  if (config.authScreens) {
    hooks.push(
      'useForgotPassword', 'useResetPassword', 'useVerifyEmail', 'useResendVerification',
      'useSetPassword', 'useSessions', 'useRevokeSession', 'useDeleteAccount', 'useCancelDeletion',
    )
  }
  if (config.mfaScreens) {
    hooks.push(
      'useMfaSetup', 'useMfaVerifySetup', 'useMfaDisable', 'useMfaMethods', 'useMfaResend',
      'useEmailOtpEnable', 'useEmailOtpVerifySetup',
    )
  }
  if (config.webSocket) hooks.push('useRoom', 'useRoomEvent')
  if (config.communityScreens) {
    hooks.push(
      // Containers
      'useContainers', 'useContainer', 'useCreateContainer', 'useUpdateContainer', 'useDeleteContainer',
      // Threads
      'useContainerThreads', 'useContainerThread', 'useCreateThread', 'useUpdateThread', 'useDeleteThread',
      'usePublishThread', 'useLockThread', 'usePinThread', 'useUnpinThread',
      // Replies
      'useThreadReplies', 'useReply', 'useCreateReply', 'useUpdateReply', 'useDeleteReply',
      // Reactions
      'useThreadReactions', 'useReplyReactions',
      'useAddThreadReaction', 'useRemoveThreadReaction', 'useAddReplyReaction', 'useRemoveReplyReaction',
      // Members / Roles
      'useContainerMembers', 'useContainerModerators', 'useContainerOwners',
      'useAddMember', 'useRemoveMember',
      'useAssignModerator', 'useRemoveModerator',
      'useAssignOwner', 'useRemoveOwner',
      // Reports
      'useReports', 'useReport', 'useCreateReport', 'useResolveReport', 'useDismissReport',
      // Bans
      'useBans', 'useCheckBan', 'useCreateBan', 'useRemoveBan',
      // Notifications
      'useNotifications', 'useNotificationsUnreadCount', 'useMarkNotificationRead', 'useMarkAllNotificationsRead',
      // Search
      'useSearchThreads', 'useSearchReplies',
    )
  }
  // Webhook hooks are always available — createPocketshot instantiates them unconditionally
  hooks.push(
    'useWebhookEndpoints', 'useWebhookEndpoint', 'useCreateWebhookEndpoint',
    'useUpdateWebhookEndpoint', 'useDeleteWebhookEndpoint',
    'useWebhookDeliveries', 'useWebhookDelivery', 'useTestWebhookEndpoint',
  )
  hooks.push('formatAuthError', 'Providers', 'api', 'queryClient', 'tokenStorage')

  const destructure = hooks.join(',\n  ')

  return [
    ...imports,
    '',
    `export const pocketshot = createPocketshot({ ${createArgsStr} })`,
    '',
    `export const {`,
    `  ${destructure},`,
    `} = pocketshot`,
    '',
  ].join('\n')
}
