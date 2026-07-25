import {
  createProductServiceRegistry,
  productEnvironmentFromPublicConfig,
} from '@lastshotlabs/pocketshot/release'

export function createSGForumServices(version: string, build: number) {
  return createProductServiceRegistry(
    'sgforum',
    version,
    build,
    productEnvironmentFromPublicConfig({
      EXPO_PUBLIC_API_URL: process.env.EXPO_PUBLIC_API_URL,
      EXPO_PUBLIC_WS_ENDPOINT: process.env.EXPO_PUBLIC_WS_ENDPOINT,
      EXPO_PUBLIC_LINK_HOST: process.env.EXPO_PUBLIC_LINK_HOST,
      EXPO_PUBLIC_PRIVACY_URL: process.env.EXPO_PUBLIC_PRIVACY_URL,
      EXPO_PUBLIC_TERMS_URL: process.env.EXPO_PUBLIC_TERMS_URL,
      EXPO_PUBLIC_SUPPORT_URL: process.env.EXPO_PUBLIC_SUPPORT_URL,
      EXPO_PUBLIC_DELETION_URL: process.env.EXPO_PUBLIC_DELETION_URL,
      EXPO_PUBLIC_APPLE_SERVICE_ID: process.env.EXPO_PUBLIC_APPLE_SERVICE_ID,
      EXPO_PUBLIC_GOOGLE_CLIENT_ID: process.env.EXPO_PUBLIC_GOOGLE_CLIENT_ID,
      EXPO_PUBLIC_ANALYTICS_ENDPOINT: process.env.EXPO_PUBLIC_ANALYTICS_ENDPOINT,
      EXPO_PUBLIC_CRASH_ENDPOINT: process.env.EXPO_PUBLIC_CRASH_ENDPOINT,
      EXPO_PUBLIC_FEATURE_FLAG_ENDPOINT: process.env.EXPO_PUBLIC_FEATURE_FLAG_ENDPOINT,
    }),
  )
}
