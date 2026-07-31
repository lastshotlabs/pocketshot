import { readdir, readFile, stat } from 'node:fs/promises'
import { dirname, join, relative, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'

const root = fileURLToPath(new URL('../', import.meta.url))
const dist = join(root, 'dist')
const sourceRoot = join(root, 'src/ui/components')
const packageJson = JSON.parse(await readFile(join(root, 'package.json'), 'utf8'))
const failures = []

const focusedExport = packageJson.exports?.['./ui/components/*']
if (
  focusedExport?.types !== './dist/types/ui/components/*/index.d.ts' ||
  focusedExport?.import !== './dist/ui/components/*/index.js' ||
  focusedExport?.require !== './dist/ui/components/*/index.cjs'
) {
  failures.push('package.json focused UI wildcard export is missing or malformed')
}

const components = []
for (const category of await readdir(sourceRoot, { withFileTypes: true })) {
  if (!category.isDirectory() || category.name.startsWith('_')) continue
  for (const component of await readdir(join(sourceRoot, category.name), {
    withFileTypes: true,
  })) {
    if (component.isDirectory()) components.push(`${category.name}/${component.name}`)
  }
}

for (const component of components) {
  for (const target of [
    `dist/ui/components/${component}/index.js`,
    `dist/ui/components/${component}/index.cjs`,
    `dist/types/ui/components/${component}/index.d.ts`,
  ]) {
    try {
      await stat(join(root, target))
    } catch {
      failures.push(`focused UI target does not exist: ${target}`)
    }
  }
}

const checks = [
  { name: 'simple Button', path: 'ui/components/forms/button/index.js', maximum: 128 * 1024 },
  {
    name: 'complex ChatWindow',
    path: 'ui/components/communication/chat-window/index.js',
    maximum: 192 * 1024,
  },
]
const fullUi = await moduleGraph('ui.js')

for (const check of checks) {
  const graph = await moduleGraph(check.path)
  if (graph.bytes > check.maximum) {
    failures.push(`${check.name} ESM graph is ${graph.bytes} bytes; maximum is ${check.maximum}`)
  }
  if (graph.files.has('ui.js')) {
    failures.push(`${check.name} focused entry reaches the monolithic UI entry`)
  }
  if (fullUi.bytes < graph.bytes * 4) {
    failures.push(
      `${check.name} isolation is too weak: ${graph.bytes} bytes vs ${fullUi.bytes} full UI bytes`,
    )
  }
  const cjsPath = join(dist, check.path.replace(/\.js$/, '.cjs'))
  const cjsBytes = (await stat(cjsPath)).size
  if (cjsBytes > 64 * 1024) {
    failures.push(`${check.name} CJS entry is ${cjsBytes} bytes; maximum is ${64 * 1024}`)
  }
  check.graph = graph
  check.cjsBytes = cjsBytes
}

if (failures.length) {
  console.error(`Focused UI isolation gate failed:\n- ${failures.join('\n- ')}`)
  process.exit(1)
}

console.log(
  `Focused UI isolation passes (${components.length} component exports; full UI ${fullUi.bytes} bytes; ${checks
    .map((check) => `${check.name} ${check.graph.bytes} ESM/${check.cjsBytes} CJS bytes`)
    .join('; ')}).`,
)

async function moduleGraph(entry) {
  const files = new Set()
  let bytes = 0
  const pending = [entry]
  while (pending.length) {
    const name = pending.pop()
    if (!name || files.has(name)) continue
    files.add(name)
    const path = join(dist, name)
    const body = await readFile(path, 'utf8')
    bytes += Buffer.byteLength(body)
    const imports = [
      ...body.matchAll(/(?:from\s*|import\s*)["'](\.[^"']+)["']/g),
      ...body.matchAll(/import\(["'](\.[^"']+)["']\)/g),
    ]
    for (const match of imports) {
      const imported = relative(dist, resolve(dirname(path), match[1])).replaceAll('\\', '/')
      if (imported.startsWith('..')) {
        failures.push(`${entry} imports outside dist: ${match[1]}`)
      } else {
        pending.push(imported)
      }
    }
  }
  return { files, bytes }
}
