import fs from 'node:fs/promises'
import path from 'node:path'
import { log, spinner } from '@clack/prompts'
import type { PocketshotScaffoldConfig } from './types'
import { exec } from './utils'
import { packageJsonTemplate } from './templates/package-json'
import { appJsonTemplate } from './templates/app-json'
import { tsconfigTemplate } from './templates/tsconfig'
import { envTemplate } from './templates/env'
import { pocketshotConfigTemplate } from './templates/pocketshot-config'
import { libConfigTemplate } from './templates/lib/config'
import { libPocketshotTemplate } from './templates/lib/pocketshot-lib'
import { rootLayoutTemplate } from './templates/app/root-layout'
import { appLayoutTemplate } from './templates/app/app-layout'
import { appIndexTemplate } from './templates/app/app-index'
import { authLayoutTemplate } from './templates/app/auth-layout'
import { authLoginTemplate } from './templates/app/auth-login'
import { authRegisterTemplate } from './templates/app/auth-register'
import { authMfaTemplate } from './templates/app/auth-mfa'
import { authForgotPasswordTemplate } from './templates/app/auth-forgot-password'
import { authResetPasswordTemplate } from './templates/app/auth-reset-password'
import { authVerifyEmailTemplate } from './templates/app/auth-verify-email'
import { authOAuthCallbackTemplate } from './templates/app/auth-oauth-callback'
import { settingsIndexTemplate } from './templates/app/settings-index'
import { settingsPasswordTemplate } from './templates/app/settings-password'
import { settingsSessionsTemplate } from './templates/app/settings-sessions'
import { settingsDeleteAccountTemplate } from './templates/app/settings-delete-account'
import { settingsEmailOtpTemplate } from './templates/app/settings-email-otp'
import { appMfaSetupTemplate } from './templates/app/app-mfa-setup'
import { communityContainersTemplate } from './templates/app/community-containers'
import { communityThreadListTemplate } from './templates/app/community-thread-list'
import { communityThreadTemplate } from './templates/app/community-thread'
import { pushSetupTemplate } from './templates/app/push-setup'
import { deepLinksSetupTemplate } from './templates/app/deep-links-setup'
import { offlineProviderTemplate } from './templates/lib/offline-provider'

const GITIGNORE_CONTENT = `node_modules/
.expo/
dist/
*.log
.env
`

export async function scaffold(config: PocketshotScaffoldConfig): Promise<void> {
  async function write(relPath: string, content: string): Promise<void> {
    const abs = path.join(config.dir, relPath)
    await fs.mkdir(path.dirname(abs), { recursive: true })
    await fs.writeFile(abs, content, 'utf8')
  }

  await fs.mkdir(config.dir, { recursive: true })

  // Config files
  await write('package.json', packageJsonTemplate(config))
  await write('app.json', appJsonTemplate(config))
  await write('tsconfig.json', tsconfigTemplate())
  await write('.env.example', envTemplate(config))
  await write('.gitignore', GITIGNORE_CONTENT)
  await write('pocketshot.config.json', pocketshotConfigTemplate())

  // Lib files
  await write('lib/config.ts', libConfigTemplate(config))
  await write('lib/pocketshot.ts', libPocketshotTemplate(config))

  // Root layout
  await write('app/_layout.tsx', rootLayoutTemplate())

  // App routes
  await write('app/(app)/_layout.tsx', appLayoutTemplate())
  await write('app/(app)/index.tsx', appIndexTemplate(config))

  // Auth routes
  await write('app/(auth)/_layout.tsx', authLayoutTemplate(config))
  await write('app/(auth)/login.tsx', authLoginTemplate())
  await write('app/(auth)/register.tsx', authRegisterTemplate())
  await write('app/(auth)/mfa.tsx', authMfaTemplate())

  if (config.authScreens) {
    await write('app/(auth)/forgot-password.tsx', authForgotPasswordTemplate())
    await write('app/(auth)/reset-password.tsx', authResetPasswordTemplate())
    await write('app/(auth)/verify-email.tsx', authVerifyEmailTemplate())
  }

  if (config.oauthScreens) {
    await write('app/(auth)/oauth-callback.tsx', authOAuthCallbackTemplate())
  }

  if (config.authScreens) {
    await write('app/(app)/settings/index.tsx', settingsIndexTemplate())
    await write('app/(app)/settings/password.tsx', settingsPasswordTemplate())
    await write('app/(app)/settings/sessions.tsx', settingsSessionsTemplate())
    await write('app/(app)/settings/delete-account.tsx', settingsDeleteAccountTemplate())
  }

  if (config.mfaScreens) {
    await write('app/(app)/settings/email-otp.tsx', settingsEmailOtpTemplate())
    await write('app/(app)/mfa-setup.tsx', appMfaSetupTemplate())
  }

  if (config.communityScreens) {
    await write('app/(app)/community/index.tsx', communityContainersTemplate())
    await write('app/(app)/community/[containerId]/threads.tsx', communityThreadListTemplate())
    await write('app/(app)/community/threads/[threadId].tsx', communityThreadTemplate())
  }

  if (config.pushNotifications) {
    await write('lib/usePushSetup.ts', pushSetupTemplate(config))
  }

  if (config.deepLinks) {
    await write('lib/useDeepLinks.ts', deepLinksSetupTemplate(config))
  }

  if (config.offlineSupport) {
    await write('lib/useOfflineSync.ts', offlineProviderTemplate())
  }

  // Step: install dependencies
  const s = spinner()
  s.start('Installing dependencies')
  let installOk = false
  try {
    exec('bun install', config.dir, true)
    installOk = true
  } catch {
    try {
      exec('npm install', config.dir, true)
      installOk = true
    } catch (err) {
      s.stop('Dependency install failed — run install manually')
      log.warn(
        `Install failed: ${err instanceof Error ? err.message : String(err)}\n` +
          `  cd ${config.dir} && npm install`,
      )
    }
  }
  if (installOk) s.stop('Dependencies installed')

  // Step: git init
  if (config.gitInit) {
    s.start('Initialising git repository')
    try {
      exec('git init && git add -A && git commit -m "init: pocketshot scaffold"', config.dir, true)
      s.stop('Git repository initialised')
    } catch (err) {
      s.stop('Git init failed')
      const stderr = (err as NodeJS.ErrnoException & { stderr?: Buffer })?.stderr
      log.warn(`Git init failed: ${stderr?.toString() ?? String(err)}`)
    }
  }
}
