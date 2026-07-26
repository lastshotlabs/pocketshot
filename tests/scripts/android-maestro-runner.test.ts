import { chmodSync, mkdtempSync, readFileSync, statSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { spawnSync } from 'node:child_process'
import { describe, expect, it } from 'vitest'

const runner = join(process.cwd(), 'scripts/run-android-maestro.sh')

function fixture(options: { appAlive: boolean; maestroStatuses: number[] }) {
  const directory = mkdtempSync(join(tmpdir(), 'pocketshot-maestro-'))
  const flow = join(directory, 'flow.yaml')
  const adb = join(directory, 'adb')
  const maestro = join(directory, 'maestro')
  const attempts = join(directory, 'attempts')
  const statuses = join(directory, 'statuses')
  const diagnostics = join(directory, 'diagnostics')

  writeFileSync(flow, 'appId: com.lastshotlabs.test\n---\n- launchApp:\n')
  writeFileSync(statuses, options.maestroStatuses.join('\n'))
  writeFileSync(
    adb,
    `#!/usr/bin/env bash
if [[ "$1 $2" == "shell pidof" ]]; then
  ${options.appAlive ? "printf '4242\\n'" : 'exit 0'}
elif [[ "$1" == "logcat" && "$2" == "-v" ]]; then
  printf 'mock logcat\\n'
else
  printf 'mock adb %s\\n' "$*"
fi
`,
  )
  writeFileSync(
    maestro,
    `#!/usr/bin/env bash
attempt=0
[[ -f ${JSON.stringify(attempts)} ]] && attempt=$(cat ${JSON.stringify(attempts)})
attempt=$((attempt + 1))
printf '%s' "$attempt" > ${JSON.stringify(attempts)}
status=$(sed -n "\${attempt}p" ${JSON.stringify(statuses)})
exit "\${status:-0}"
`,
  )
  chmodSync(adb, 0o755)
  chmodSync(maestro, 0o755)

  return { directory, flow, adb, maestro, attempts, diagnostics }
}

function run(item: ReturnType<typeof fixture>) {
  return spawnSync(runner, [item.flow], {
    encoding: 'utf8',
    env: {
      ...process.env,
      ADB_BIN: item.adb,
      MAESTRO_BIN: item.maestro,
      ANDROID_MAESTRO_DIAGNOSTICS_DIR: item.diagnostics,
    },
  })
}

describe('classified Android Maestro runner', () => {
  it('is executable in clean Unix checkouts', () => {
    expect(statSync(runner).mode & 0o111).not.toBe(0)
  })

  it('retries exactly once when the app is still alive', () => {
    const item = fixture({ appAlive: true, maestroStatuses: [1, 0] })
    const result = run(item)

    expect(result.status).toBe(0)
    expect(result.stderr).toContain('retrying once as runner instability')
    expect(readFileSync(item.attempts, 'utf8')).toBe('2')
  })

  it('does not hide an app process termination with a retry', () => {
    const item = fixture({ appAlive: false, maestroStatuses: [1] })
    const result = run(item)

    expect(result.status).toBe(1)
    expect(result.stderr).toContain('classified as app process termination')
    expect(readFileSync(item.attempts, 'utf8')).toBe('1')
    expect(readFileSync(join(item.diagnostics, 'flow-attempt-1-exit-info.txt'), 'utf8')).toContain(
      'mock adb shell dumpsys activity exit-info',
    )
  })
})
