import { defineConfig } from 'tsup'

const peerDeps = [
  '@tanstack/react-query',
  'expo-router',
  'expo-secure-store',
  'jotai',
  'react',
  'react-native',
  // Optional native peers — duck-typed at runtime
  'react-native-qrcode-svg',
  'react-native-maps',
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
    entry: { index: 'src/index.ts', ui: 'src/ui.ts' },
    format: ['esm', 'cjs'],
    dts: true,
    external: peerDeps,
    outDir: 'dist',
  },
])
