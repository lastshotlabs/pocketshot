import process from 'node:process'
import path from 'node:path'
import { intro, outro, cancel, log } from '@clack/prompts'
import { runPrompts } from './prompts'
import { scaffold } from './scaffold'
import { runSync } from './sync'
import { runManifestSync } from './manifest-sync'
import { runDoctor } from './doctor'
import { runEasWorkflow, runUpgradeWorkflow, runVerifyWorkflow } from './workflows'

async function main() {
  const args = process.argv.slice(2)
  const positionals = args.filter((a) => !a.startsWith('--') && !a.startsWith('-'))

  // Subcommand: pocketshot sync
  if (positionals[0] === 'sync') {
    intro('@lastshotlabs/pocketshot sync')
    const apiIdx = args.indexOf('--api')
    const apiUrl =
      apiIdx !== -1 ? args[apiIdx + 1] : args.find((a) => a.startsWith('--api='))?.slice(6)
    const fileIdx = args.indexOf('--file')
    const filePath =
      fileIdx !== -1 ? args[fileIdx + 1] : args.find((a) => a.startsWith('--file='))?.slice(7)
    const watch = args.includes('--watch') || args.includes('-w')
    const zod = args.includes('--zod')
    const apiDirIdx = args.indexOf('--api-dir')
    const apiDirArg =
      apiDirIdx !== -1
        ? args[apiDirIdx + 1]
        : args.find((a) => a.startsWith('--api-dir='))?.slice(10)
    const hooksDirIdx = args.indexOf('--hooks-dir')
    const hooksDirArg =
      hooksDirIdx !== -1
        ? args[hooksDirIdx + 1]
        : args.find((a) => a.startsWith('--hooks-dir='))?.slice(13)
    const typesPathIdx = args.indexOf('--types-path')
    const typesPathArg =
      typesPathIdx !== -1
        ? args[typesPathIdx + 1]
        : args.find((a) => a.startsWith('--types-path='))?.slice(13)
    const pocketshotImportIdx = args.indexOf('--pocketshot-import')
    const pocketshotImportArg =
      pocketshotImportIdx !== -1
        ? args[pocketshotImportIdx + 1]
        : args.find((a) => a.startsWith('--pocketshot-import='))?.slice(20)
    await runSync({
      apiUrl,
      filePath,
      cwd: process.cwd(),
      watch,
      zod,
      apiDir: apiDirArg,
      hooksDir: hooksDirArg,
      typesPath: typesPathArg,
      pocketshotImport: pocketshotImportArg,
    })
    return
  }

  // Subcommand: pocketshot manifest
  if (positionals[0] === 'manifest') {
    intro('@lastshotlabs/pocketshot manifest')
    const apiIdx = args.indexOf('--api')
    const apiUrl =
      apiIdx !== -1 ? args[apiIdx + 1] : args.find((a) => a.startsWith('--api='))?.slice(6)
    const outIdx = args.indexOf('--out')
    const outDir =
      outIdx !== -1
        ? args[outIdx + 1]
        : (args.find((a) => a.startsWith('--out='))?.slice(6) ?? 'app/manifest')

    if (!apiUrl) {
      log.error('--api <url> is required for manifest command')
      log.info('Usage: pocketshot manifest --api https://api.example.com --out app/manifest')
      process.exit(1)
    }

    await runManifestSync({ apiUrl, outDir, cwd: process.cwd() })
    outro('Manifest screens generated successfully')
    return
  }

  // Subcommand: pocketshot doctor
  if (positionals[0] === 'doctor') {
    const result = runDoctor({
      cwd: process.cwd(),
      release: args.includes('--release'),
    })
    const json = args.includes('--json')

    if (json) {
      console.log(JSON.stringify(result, null, 2))
    } else {
      intro('@lastshotlabs/pocketshot doctor')
      for (const check of result.checks) {
        const message = `${check.id}: ${check.message}`
        if (check.status === 'pass') log.success(message)
        if (check.status === 'warn') log.warn(`${message}${check.fix ? ` Fix: ${check.fix}` : ''}`)
        if (check.status === 'fail') log.error(`${message}${check.fix ? ` Fix: ${check.fix}` : ''}`)
      }
      outro(
        result.ok
          ? `Ready with ${result.warnings} warning${result.warnings === 1 ? '' : 's'}.`
          : `${result.failures} release blocker${result.failures === 1 ? '' : 's'} found.`,
      )
    }

    if (!result.ok) process.exitCode = 1
    return
  }

  if (positionals[0] === 'verify') {
    const result = runVerifyWorkflow({
      cwd: process.cwd(),
      release: args.includes('--release'),
    })
    console.log(JSON.stringify(result, null, 2))
    if (!result.ok) process.exitCode = 1
    return
  }

  if (positionals[0] === 'eas' || positionals[0] === 'upgrade') {
    const result =
      positionals[0] === 'eas'
        ? runEasWorkflow({
            cwd: process.cwd(),
            write: args.includes('--write'),
            force: args.includes('--force'),
          })
        : runUpgradeWorkflow({ cwd: process.cwd(), write: args.includes('--write') })
    console.log(JSON.stringify(result, null, 2))
    if (!result.ok) process.exitCode = 1
    return
  }

  // Help — must come before init, which catches the no-command case
  if (args.includes('--help') || args.includes('-h')) {
    console.log(`
pocketshot — Expo mobile framework for Slingshot backends

Commands:
  init [--yes] [--dir <path>]    Scaffold a new pocketshot app
  sync [--file <path>] [--api <url>] [--watch]
                                 Generate API client + hooks from OpenAPI spec
  manifest --api <url> [--out <dir>]
                                 Fetch and generate screens from a Slingshot manifest
  doctor [--release] [--json]    Validate Expo and native release readiness
  verify [--release]             Deterministically verify an app (JSON output)
  eas [--write] [--force]        Check or generate the EAS release baseline
  upgrade [--write]              Plan or apply the tested Expo 57 dependency line

Options:
  --yes, -y        Skip prompts, use defaults
  --dir <path>     Output directory for init
  --file <path>    OpenAPI spec file path
  --api <url>      OpenAPI spec URL or manifest URL
  --out <dir>      Output directory for manifest (default: app/manifest)
  --watch, -w      Watch mode for sync
  --pocketshot-import <path>  Import path override (default: @/lib/pocketshot)
  --api-dir <dir>  API output dir (default: lib/api)
  --hooks-dir <dir> Hooks output dir (default: lib/hooks)
  --types-path <path> Types file path (default: lib/types/api.ts)
  --zod            Generate Zod schemas
`)
    return
  }

  // Subcommand: pocketshot init
  if (positionals[0] === 'init' || !positionals[0]) {
    if (positionals[0] && positionals[0] !== 'init') {
      log.error(`Unknown command: ${positionals[0]}`)
      log.info('Usage: pocketshot init [--yes] [--dir <path>]')
      log.info('       pocketshot sync [--api <url>] [--file <path>] [--watch]')
      process.exit(1)
    }

    intro('@lastshotlabs/pocketshot init')

    const yes = args.includes('--yes') || args.includes('-y')
    const dirIdx = args.indexOf('--dir')
    const dir = dirIdx !== -1 ? args[dirIdx + 1] : undefined

    const config = await runPrompts({ yes, dir })

    if (!config) {
      cancel('Scaffold cancelled.')
      process.exit(0)
    }

    log.info(
      `Initialising ${config.projectName} in ${path.relative(process.cwd(), config.dir) || config.dir}`,
    )

    await scaffold(config)

    const relDir = path.relative(process.cwd(), config.dir)
    const wsLine = config.webSocket
      ? `    EXPO_PUBLIC_WS_ENDPOINT — your WebSocket endpoint URL\n`
      : ''

    outro(
      `${config.projectName} initialised successfully

  Next steps:

  cd ${relDir}

  Fill in your .env:
    EXPO_PUBLIC_API_URL   — your Slingshot backend URL
${wsLine}
  expo start             — start the dev server
  npx pocketshot sync    — generate typed API hooks from OpenAPI spec

  Docs: github.com/lastshotlabs/pocketshot`,
    )
    return
  }

  console.error(`Unknown command: ${positionals[0]}`)
  process.exit(1)
}

main().catch((err: unknown) => {
  const msg = err instanceof Error ? err.message : String(err)
  log.error(`Failed: ${msg}`)
  process.exit(1)
})
