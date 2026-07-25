export interface PocketshotScaffoldConfig {
  projectName: string // "My App"
  packageName: string // "my-app" (slugified)
  appId: string // "com.example.myapp"
  scheme: string // "myapp" (deep link scheme, alphanumeric only)
  dir: string // absolute output path
  authScreens: boolean // forgot/reset/verify + settings pages
  mfaScreens: boolean // MFA setup + email-otp (only if authScreens=true)
  oauthScreens: boolean // oauth-callback screen
  webSocket: boolean // WS client + useRoom/useRoomEvent
  communityScreens: boolean // community containers, thread list, thread detail screens
  gitInit: boolean
  pushNotifications: boolean // add expo-notifications setup
  deepLinks: boolean // add universal links + scheme config
  offlineSupport: boolean // add offline queue provider setup
  orgSupport: boolean // add org/permissions hooks in pocketshot.ts
  installDependencies?: boolean // defaults true; tests/tooling may generate without network install
}
