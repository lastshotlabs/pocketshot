export interface PocketshotScaffoldConfig {
  projectName: string     // "My App"
  packageName: string     // "my-app" (slugified)
  appId: string           // "com.example.myapp"
  scheme: string          // "myapp" (deep link scheme, alphanumeric only)
  dir: string             // absolute output path
  authScreens: boolean    // forgot/reset/verify + settings pages
  mfaScreens: boolean     // MFA setup + email-otp (only if authScreens=true)
  oauthScreens: boolean   // oauth-callback screen
  webSocket: boolean      // WS client + useRoom/useRoomEvent
  gitInit: boolean
}
