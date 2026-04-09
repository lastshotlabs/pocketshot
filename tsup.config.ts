import { defineConfig } from 'tsup'

const peerDeps = [
  '@tanstack/react-query',
  'expo-router',
  'expo-secure-store',
  'jotai',
  'react',
  'react-native',
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
