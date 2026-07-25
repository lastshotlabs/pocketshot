import { execFileSync } from 'node:child_process'
import { mkdtemp, readFile, rm, writeFile } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import process from 'node:process'

const projectDir = new URL('..', import.meta.url).pathname
const consumerDir = await mkdtemp(join(tmpdir(), 'pocketshot-consumer-'))

function run(command, args, cwd = consumerDir) {
  return execFileSync(command, args, {
    cwd,
    encoding: 'utf8',
    stdio: ['ignore', 'pipe', 'pipe'],
  })
}

try {
  const packResult = JSON.parse(
    run('npm', ['pack', '--json', '--pack-destination', consumerDir], projectDir),
  )
  const tarball = join(consumerDir, packResult[0].filename)
  const sourcePackage = JSON.parse(
    await readFile(new URL('../package.json', import.meta.url), 'utf8'),
  )

  const dependencies = {
    '@tanstack/react-query': '^5.0.0',
    expo: '55',
    'expo-router': '~55.0.6',
    'expo-secure-store': '~55.0.9',
    jotai: '^2.0.0',
    react: '19.2.0',
    'react-native': '0.83.2',
    zod: '^4.0.0',
  }
  dependencies['@lastshotlabs/pocketshot'] = `file:${tarball}`

  await writeFile(
    join(consumerDir, 'package.json'),
    JSON.stringify(
      {
        name: 'pocketshot-clean-consumer',
        version: '0.0.0',
        private: true,
        scripts: { typecheck: 'tsc --noEmit' },
        dependencies,
        devDependencies: {
          '@types/react': sourcePackage.devDependencies['@types/react'],
          typescript: sourcePackage.devDependencies.typescript,
        },
      },
      null,
      2,
    ),
  )
  await writeFile(
    join(consumerDir, 'tsconfig.json'),
    JSON.stringify(
      {
        extends: 'expo/tsconfig.base',
        compilerOptions: {
          moduleResolution: 'bundler',
          strict: true,
          skipLibCheck: true,
        },
        include: ['consumer.tsx'],
      },
      null,
      2,
    ),
  )
  await writeFile(
    join(consumerDir, 'consumer.tsx'),
    `import React from 'react'
import { createPocketshot, type PocketshotConfig } from '@lastshotlabs/pocketshot'
import {
  ButtonBase,
  type ButtonBaseProps,
  type ManifestConfig,
} from '@lastshotlabs/pocketshot/ui'

const config: PocketshotConfig = { apiUrl: 'https://api.example.test' }
const sdk = createPocketshot(config)
void sdk.api

const button: ButtonBaseProps = { label: 'Continue', onPress: () => undefined }
const manifest: ManifestConfig = {
  name: 'Consumer',
  screens: { home: { id: 'home', components: [] } },
}
void manifest

export const Consumer = () => <ButtonBase {...button} />
`,
  )

  run('npm', ['install', '--legacy-peer-deps', '--ignore-scripts', '--no-audit', '--no-fund'])
  run('npm', ['run', 'typecheck'])

  const installed = JSON.parse(
    await readFile(join(consumerDir, 'node_modules/@lastshotlabs/pocketshot/package.json'), 'utf8'),
  )
  if (installed.version !== sourcePackage.version) {
    throw new Error(
      `Installed PocketShot ${installed.version}; expected packed version ${sourcePackage.version}`,
    )
  }

  console.log(`Clean consumer verified against @lastshotlabs/pocketshot@${installed.version}.`)
} catch (error) {
  if (error && typeof error === 'object' && 'stderr' in error) {
    process.stderr.write(String(error.stderr))
  }
  throw error
} finally {
  if (process.env.POCKETSHOT_KEEP_CONSUMER) {
    console.log(`Consumer retained at ${consumerDir}`)
  } else {
    await rm(consumerDir, { recursive: true, force: true })
  }
}
