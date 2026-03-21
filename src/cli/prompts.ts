import path from 'node:path'
import { text, confirm, isCancel } from '@clack/prompts'
import { slugify, schemeify } from './utils'
import type { PocketshotScaffoldConfig } from './types'

interface PromptOptions {
  yes?: boolean
  dir?: string
}

export async function runPrompts(opts: PromptOptions): Promise<PocketshotScaffoldConfig | null> {
  const { yes: skipPrompts, dir: dirArg } = opts

  // 1. Project name
  let projectName: string
  if (skipPrompts) {
    projectName = 'My Pocketshot App'
  } else {
    const val = await text({
      message: 'Project name',
      placeholder: 'My Pocketshot App',
      validate: (v) => { if (!v?.trim()) return 'Project name is required' },
    })
    if (isCancel(val)) return null
    projectName = val as string
  }

  if (skipPrompts) {
    const packageName = slugify(projectName)
    const scheme = schemeify(packageName)
    const dir = dirArg
      ? path.resolve(process.cwd(), dirArg)
      : path.join(process.cwd(), packageName)
    return {
      projectName,
      packageName,
      appId: `com.example.${packageName.replace(/-/g, '')}`,
      scheme,
      dir,
      authScreens: true,
      mfaScreens: false,
      oauthScreens: true,
      webSocket: true,
      communityScreens: false,
      gitInit: true,
    }
  }

  // 2. Package name
  const pkgVal = await text({
    message: 'Package name',
    initialValue: slugify(projectName),
    validate: (v) => { if (!v?.trim()) return 'Package name is required' },
  })
  if (isCancel(pkgVal)) return null
  const packageName = pkgVal as string

  // 3. App ID
  const appIdVal = await text({
    message: 'App ID (bundle identifier)',
    initialValue: `com.example.${packageName.replace(/-/g, '')}`,
    validate: (v) => { if (!v?.trim()) return 'App ID is required' },
  })
  if (isCancel(appIdVal)) return null
  const appId = appIdVal as string

  // 4. Deep link scheme
  const schemeVal = await text({
    message: 'Deep link scheme (alphanumeric only)',
    initialValue: schemeify(packageName),
    validate: (v) => {
      if (!v?.trim()) return 'Scheme is required'
      if (!/^[a-z0-9]+$/.test(v.trim())) return 'Scheme must be alphanumeric only'
    },
  })
  if (isCancel(schemeVal)) return null
  const scheme = (schemeVal as string).replace(/[^a-z0-9]/g, '')

  const dir = dirArg
    ? path.resolve(process.cwd(), dirArg)
    : path.join(process.cwd(), packageName)

  // 5. Auth screens
  const authVal = await confirm({
    message: 'Include auth screens (forgot/reset/verify-email + settings)?',
    initialValue: true,
  })
  if (isCancel(authVal)) return null
  const authScreens = authVal as boolean

  // 6. MFA screens (only if authScreens)
  let mfaScreens = false
  if (authScreens) {
    const mfaVal = await confirm({
      message: 'Include MFA screens (setup + email OTP)?',
      initialValue: false,
    })
    if (isCancel(mfaVal)) return null
    mfaScreens = mfaVal as boolean
  }

  // 7. OAuth callback screen
  const oauthVal = await confirm({
    message: 'Include OAuth callback screen?',
    initialValue: true,
  })
  if (isCancel(oauthVal)) return null
  const oauthScreens = oauthVal as boolean

  // 8. WebSocket support
  const wsVal = await confirm({
    message: 'WebSocket support?',
    initialValue: true,
  })
  if (isCancel(wsVal)) return null
  const webSocket = wsVal as boolean

  // 9. Community screens
  const communityVal = await confirm({
    message: 'Include community screens (containers, thread list, thread detail)?',
    initialValue: false,
  })
  if (isCancel(communityVal)) return null
  const communityScreens = communityVal as boolean

  // 10. Git init
  const gitVal = await confirm({
    message: 'Git init?',
    initialValue: true,
  })
  if (isCancel(gitVal)) return null
  const gitInit = gitVal as boolean

  return {
    projectName,
    packageName,
    appId,
    scheme,
    dir,
    authScreens,
    mfaScreens,
    oauthScreens,
    webSocket,
    communityScreens,
    gitInit,
  }
}
