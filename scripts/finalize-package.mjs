import { chmod } from 'node:fs/promises'

await chmod(new URL('../dist/cli.cjs', import.meta.url), 0o755)
