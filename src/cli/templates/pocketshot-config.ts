export function pocketshotConfigTemplate(): string {
  return JSON.stringify({
    apiDir: 'lib/api',
    hooksDir: 'lib/hooks',
    typesPath: 'lib/types/api.ts',
    pocketshotImport: '@/lib/pocketshot',
  }, null, 2)
}
