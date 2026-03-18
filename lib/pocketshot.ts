import { createPocketshot } from '@lastshotlabs/pocketshot'
import { API_BASE_URL, WS_BASE_URL } from './config'

export const pocketshot = createPocketshot({ apiUrl: API_BASE_URL, wsUrl: WS_BASE_URL })

export const {
  useUser,
  useLogin,
  useRegister,
  useLogout,
  useVerifyMfa,
  useExchangeOAuthCode,
  useForgotPassword,
  useResetPassword,
  useVerifyEmail,
  useResendVerification,
  useSetPassword,
  useSessions,
  useRevokeSession,
  useDeleteAccount,
  useCancelDeletion,
  useMfaSetup,
  useMfaVerifySetup,
  useMfaDisable,
  useMfaMethods,
  useMfaResend,
  useEmailOtpEnable,
  useEmailOtpVerifySetup,
  useRoom,
  useRoomEvent,
  Providers,
  api,
  queryClient,
  tokenStorage,
} = pocketshot
