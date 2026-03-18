import process from 'node:process'
import path from 'node:path'
import { intro, outro, cancel, log } from '@clack/prompts'
import { runPrompts } from './prompts'
import { scaffold } from './scaffold'
import { runSync } from './sync'

async function main() {
  const args = process.argv.slice(2)
  const positionals = args.filter((a) => !a.startsWith('--') && !a.startsWith('-'))

  // Subcommand: pocketshot sync
  if (positionals[0] === 'sync') {
    intro('@lastshotlabs/pocketshot sync')
    const apiIdx = args.indexOf('--api')
    const apiUrl =
      apiIdx !== -1
        ? args[apiIdx + 1]
        : args.find((a) => a.startsWith('--api='))?.slice(6)
    const fileIdx = args.indexOf('--file')
    const filePath =
      fileIdx !== -1
        ? args[fileIdx + 1]
        : args.find((a) => a.startsWith('--file='))?.slice(7)
    const watch = args.includes('--watch') || args.includes('-w')
    const zod = args.includes('--zod')
    const apiDirIdx = args.indexOf('--api-dir')
    const apiDirArg = apiDirIdx !== -1 ? args[apiDirIdx + 1] : args.find((a) => a.startsWith('--api-dir='))?.slice(10)
    const hooksDirIdx = args.indexOf('--hooks-dir')
    const hooksDirArg = hooksDirIdx !== -1 ? args[hooksDirIdx + 1] : args.find((a) => a.startsWith('--hooks-dir='))?.slice(13)
    const typesPathIdx = args.indexOf('--types-path')
    const typesPathArg = typesPathIdx !== -1 ? args[typesPathIdx + 1] : args.find((a) => a.startsWith('--types-path='))?.slice(13)
    const pocketshotImportIdx = args.indexOf('--pocketshot-import')
    const pocketshotImportArg = pocketshotImportIdx !== -1 ? args[pocketshotImportIdx + 1] : args.find((a) => a.startsWith('--pocketshot-import='))?.slice(20)
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

  // Subcommand: pocketshot init
  if (positionals[0] === 'init' || !positionals[0]) {
    if (positionals[0] && positionals[0] !== 'init' && positionals[0] !== '--help' && positionals[0] !== '-h') {
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

    log.info(`Initialising ${config.projectName} in ${path.relative(process.cwd(), config.dir) || config.dir}`)

    await scaffold(config)

    const relDir = path.relative(process.cwd(), config.dir)
    const wsLine = config.webSocket
      ? `    EXPO_PUBLIC_WS_URL    — your WebSocket URL\n`
      : ''

    outro(
      `${config.projectName} initialised successfully

  Next steps:

  cd ${relDir}

  Fill in your .env:
    EXPO_PUBLIC_API_URL   — your bunshot backend URL
${wsLine}
  expo start             — start the dev server
  npx pocketshot sync    — generate typed API hooks from OpenAPI spec

  Docs: github.com/lastshotlabs/pocketshot`,
    )
    return
  }

  // Help or unknown command
  if (positionals[0] === '--help' || positionals[0] === '-h' || args.includes('--help') || args.includes('-h')) {
    console.log(`
pocketshot — Expo mobile framework for bunshot backends

Commands:
  init [--yes] [--dir <path>]    Scaffold a new pocketshot app
  sync [--file <path>] [--api <url>] [--watch]
                                 Generate API client + hooks from OpenAPI spec

Options:
  --yes, -y        Skip prompts, use defaults
  --dir <path>     Output directory for init
  --file <path>    OpenAPI spec file path
  --api <url>      OpenAPI spec URL
  --watch, -w      Watch mode for sync
  --pocketshot-import <path>  Import path override (default: @/lib/pocketshot)
  --api-dir <dir>  API output dir (default: src/api)
  --hooks-dir <dir> Hooks output dir (default: src/hooks/api)
  --types-path <path> Types file path (default: src/types/api.ts)
  --zod            Generate Zod schemas
`)
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
