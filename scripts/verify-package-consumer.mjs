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
    env: { ...process.env, CI: '1' },
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
    expo: '~57.0.8',
    'expo-linking': '~57.0.4',
    'expo-router': '~57.0.8',
    'expo-secure-store': '~57.0.1',
    'expo-status-bar': '~57.0.1',
    'expo-web-browser': '~57.0.2',
    jotai: '^2.0.0',
    react: '19.2.3',
    'react-native': '0.86.0',
    'react-native-safe-area-context': '~5.7.0',
    'react-native-screens': '~4.26.0',
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
        main: 'index.js',
        scripts: { typecheck: 'tsc --noEmit' },
        dependencies,
        devDependencies: {
          '@types/react': '~19.2.4',
          typescript: '~6.0.3',
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
import { createRealtimeChannel, MemoryRealtimeStorage } from '@lastshotlabs/pocketshot/realtime'
import { OfflineQueue, createMemoryOfflineQueueStorage } from '@lastshotlabs/pocketshot/offline'
import { createDurableDraft, createMemoryDraftStorage } from '@lastshotlabs/pocketshot/drafts'
import { ReliabilityHarness } from '@lastshotlabs/pocketshot/testing'
import {
  MediaPipelineController,
  createMemoryMediaStorage,
  type MediaAsset,
} from '@lastshotlabs/pocketshot/media'
import { AiConversationController, createMemoryAiStorage } from '@lastshotlabs/pocketshot/ai'
import { PlaybackController, type AudioTrack } from '@lastshotlabs/pocketshot/audio'
import { z } from 'zod'

const config: PocketshotConfig = { apiUrl: 'https://api.example.test' }
const sdk = createPocketshot(config)
void sdk.api

const button: ButtonBaseProps = { label: 'Continue', onPress: () => undefined }
const manifest: ManifestConfig = {
  name: 'Consumer',
  screens: { home: { id: 'home', components: [] } },
}
void manifest

const realtime = createRealtimeChannel({
  channel: 'consumer',
  url: 'wss://api.example.test/realtime',
  schemas: { payload: z.string(), state: z.array(z.string()) },
  fetchSnapshot: async () => ({ version: 1, channel: 'consumer', cursor: 0, state: [] }),
  reduce: (state, event) => [...state, event.payload],
  storage: new MemoryRealtimeStorage(),
})
void realtime

const offline = new OfflineQueue({ storage: createMemoryOfflineQueueStorage() })
void offline

const draft = createDurableDraft({
  id: 'consumer-draft',
  initialValue: { title: '' },
  storage: createMemoryDraftStorage(),
  publishSchema: z.object({ title: z.string().min(1) }),
  saveRemote: async ({ value }) => ({ value, version: '1' }),
})
void draft
void new ReliabilityHarness()
const mediaAsset: MediaAsset = {
  uri: 'file:///photo.jpg',
  name: 'photo.jpg',
  mimeType: 'image/jpeg',
  kind: 'image',
  size: 1,
}
const media = new MediaPipelineController({
  capture: {
    requestPermission: async () => ({ state: 'granted', canAskAgain: true }),
    acquire: async () => mediaAsset,
  },
  upload: {
    createSession: async () => ({ id: '1', offset: 0, chunkSize: 1 }),
    getOffset: async () => 0,
    uploadChunk: async ({ offset, length }) => ({ offset: offset + length }),
    complete: async () => ({ fileUrl: 'https://cdn.example.test/photo.jpg' }),
  },
  storage: createMemoryMediaStorage(),
})
void media
const ai = new AiConversationController({
  storage: createMemoryAiStorage(),
  transport: {
    createAttempt: async () => ({
      attemptId: 'attempt',
      userMessageId: 'user',
      assistantMessageId: 'assistant',
    }),
    stream: async function* () {
      yield { type: 'complete' as const, sequence: 1, attemptId: 'attempt' }
    },
    cancel: async () => undefined,
  },
})
void ai
const audioTrack: AudioTrack = {
  id: 'track',
  provider: 'consumer',
  title: 'Track',
  playable: true,
}
const playback = new PlaybackController({
  deviceId: 'consumer-device',
  adapter: {
    configure: async () => undefined,
    load: async () => undefined,
    play: async () => undefined,
    pause: async () => undefined,
    stop: async () => undefined,
    seek: async () => undefined,
    unload: async () => undefined,
    subscribe: () => () => undefined,
    setRemoteCommandHandler: () => () => undefined,
  },
})
void audioTrack
void playback

export const Consumer = () => <ButtonBase {...button} />
`,
  )
  await writeFile(
    join(consumerDir, 'App.tsx'),
    `import React from 'react'
import { ButtonBase } from '@lastshotlabs/pocketshot/ui'

export default function App() {
  return <ButtonBase label="PocketShot consumer" onPress={() => undefined} />
}
`,
  )
  await writeFile(
    join(consumerDir, 'index.js'),
    `import { registerRootComponent } from 'expo'
import App from './App'

registerRootComponent(App)
`,
  )
  await writeFile(
    join(consumerDir, 'app.json'),
    JSON.stringify({
      expo: {
        name: 'PocketShot Consumer',
        slug: 'pocketshot-consumer',
        version: '0.0.0',
        platforms: ['android', 'ios'],
      },
    }),
  )

  run('npm', ['install', '--legacy-peer-deps', '--ignore-scripts', '--no-audit', '--no-fund'])
  run('npm', ['run', 'typecheck'])
  run('npx', ['expo', 'export', '--platform', 'all', '--output-dir', 'bundle', '--clear'])

  const installed = JSON.parse(
    await readFile(join(consumerDir, 'node_modules/@lastshotlabs/pocketshot/package.json'), 'utf8'),
  )
  if (installed.version !== sourcePackage.version) {
    throw new Error(
      `Installed PocketShot ${installed.version}; expected packed version ${sourcePackage.version}`,
    )
  }

  console.log(
    `Clean consumer typechecked and bundled for iOS/Android against @lastshotlabs/pocketshot@${installed.version}.`,
  )
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
