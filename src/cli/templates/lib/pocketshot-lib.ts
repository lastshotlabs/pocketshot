import type { PocketshotScaffoldConfig } from '../../types'

export function libPocketshotTemplate(config: PocketshotScaffoldConfig): string {
  const imports = [`import { createPocketshot } from '@lastshotlabs/pocketshot'`]
  const configImports: string[] = [`API_BASE_URL`]
  if (config.webSocket) configImports.push(`WS_BASE_URL`)
  imports.push(`import { ${configImports.join(', ')} } from './config'`)

  const createArgs: Record<string, string> = { apiUrl: 'API_BASE_URL' }
  if (config.webSocket) createArgs.wsUrl = 'WS_BASE_URL'
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
