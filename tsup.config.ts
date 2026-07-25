import { defineConfig } from 'tsup'

const peerDeps = [
  '@tanstack/react-query',
  'expo-router',
  'expo-secure-store',
  'jotai',
  'react',
  'react-native',
  'zod',
  // Optional native peers — duck-typed at runtime
  'react-native-maps',
  'react-native-markdown-display',
  'react-native-svg',
  'expo-camera',
  'expo-barcode-scanner',
  'expo-location',
  'expo-image-picker',
  'expo-document-picker',
  'expo-av',
  'expo-haptics',
  '@gorhom/bottom-sheet',
  'react-native-safe-area-context',
  'react-native-gesture-handler',
  'react-native-passkeys',
  'expo-local-authentication',
  'expo-notifications',
  'expo-image',
  'expo-font',
  'expo-splash-screen',
  'expo-sqlite',
]

export default defineConfig([
  {
    entry: { cli: 'src/cli/index.ts' },
    format: ['cjs'],
    target: 'node18',
    bundle: true,
    noExternal: [/.*/],
    banner: { js: '#!/usr/bin/env node' },
    outDir: 'dist',
  },
  {
    entry: {
      index: 'src/index.ts',
      ui: 'src/ui.ts',
      realtime: 'src/realtime/index.ts',
      offline: 'src/offline/index.ts',
      drafts: 'src/drafts/index.ts',
    },
    format: ['esm', 'cjs'],
    external: peerDeps,
    outDir: 'dist',
  },
])
