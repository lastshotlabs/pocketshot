export function tsconfigTemplate(): string {
  return JSON.stringify({
    extends: 'expo/tsconfig.base',
    compilerOptions: {
      strict: true,
      paths: { '@/*': ['./*'] },
    },
  }, null, 2)
}
