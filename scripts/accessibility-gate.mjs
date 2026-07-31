import { access, readFile, readdir } from 'node:fs/promises'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import ts from 'typescript'

const repositoryRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..')
const products = ['hitshot', 'aicoach', 'sgforum', 'burndown', 'blankslate']
const interactiveTags = new Set(['Pressable', 'TouchableOpacity', 'TouchableWithoutFeedback'])
const complexComponents = new Set([
  'chat-window',
  'comment-section',
  'emoji-picker',
  'feed',
  'gif-picker',
  'message-thread',
  'reaction-bar',
  'reaction-picker',
  'date-picker',
  'date-range-picker',
  'location-input',
  'quick-add',
  'time-picker',
  'wizard',
  'tree-view',
  'audit-log',
  'calendar',
  'kanban-board',
  'notification-feed',
])
const failures = []
let shellControls = 0
let catalogControls = 0
let catalogComponents = 0
let behaviorSuites = 0

for (const product of products) {
  const name = `products/${product}/app/index.tsx`
  const body = await readFile(path.join(repositoryRoot, name), 'utf8')
  const source = parse(name, body)
  inspectControls(source, name, new Set(['Pressable']), () => {
    shellControls += 1
  })

  const height = Number(/button:\s*\{[\s\S]*?minHeight:\s*(\d+)/.exec(body)?.[1] ?? 0)
  if (height < 44) failures.push(`${name} button touch target is below 44 points`)
}

const catalogRoot = path.join(repositoryRoot, 'src/ui/components')
for (const category of await directories(catalogRoot)) {
  const categoryRoot = path.join(catalogRoot, category)
  for (const component of await directories(categoryRoot)) {
    catalogComponents += 1
    const relativeSource = `src/ui/components/${category}/${component}/standalone.tsx`
    const sourcePath = path.join(repositoryRoot, relativeSource)
    const body = await readFile(sourcePath, 'utf8')
    inspectControls(parse(relativeSource, body), relativeSource, interactiveTags, () => {
      catalogControls += 1
    })

    const relativeTest = `src/ui/components/${category}/${component}/__tests__/component.test.tsx`
    const testPath = path.join(repositoryRoot, relativeTest)
    if (!(await exists(testPath))) {
      failures.push(`${relativeSource} has no colocated component behavior suite`)
      continue
    }
    behaviorSuites += 1
    if (complexComponents.has(component)) {
      const testBody = await readFile(testPath, 'utf8')
      if (!testBody.includes(`defineComplexComponentSuite('${component}')`)) {
        failures.push(`${relativeTest} does not use the complex behavior contract`)
      }
    }
  }
}

if (shellControls === 0) failures.push('no interactive shell controls were inspected')
if (catalogControls === 0) failures.push('no interactive catalog controls were inspected')
if (catalogComponents !== 125) {
  failures.push(`expected 125 catalog components, found ${catalogComponents}`)
}
if (behaviorSuites !== catalogComponents) {
  failures.push(`expected ${catalogComponents} behavior suites, found ${behaviorSuites}`)
}

if (failures.length) {
  console.error(`Accessibility gate failed:\n- ${failures.join('\n- ')}`)
  process.exit(1)
}

console.log(
  `Accessibility gate passes (${shellControls} shell controls, ${catalogControls} catalog controls, ${behaviorSuites} behavior suites).`,
)

function inspectControls(source, name, tags, onControl) {
  walk(source, (node) => {
    if (!ts.isJsxOpeningElement(node) && !ts.isJsxSelfClosingElement(node)) return
    if (!tags.has(node.tagName.getText(source))) return

    const attributes = new Map(
      node.attributes.properties
        .filter(ts.isJsxAttribute)
        .map((attribute) => [attribute.name.getText(source), attribute]),
    )
    if (isExplicitlyInaccessible(attributes.get('accessible'))) return

    onControl()
    if (!attributes.has('accessibilityRole')) {
      failures.push(`${name}:${line(node, source)} control is missing accessibilityRole`)
    }
    if (!attributes.has('accessibilityLabel')) {
      failures.push(`${name}:${line(node, source)} control is missing accessibilityLabel`)
    }
  })
}

function isExplicitlyInaccessible(attribute) {
  return (
    attribute?.initializer != null &&
    ts.isJsxExpression(attribute.initializer) &&
    attribute.initializer.expression?.kind === ts.SyntaxKind.FalseKeyword
  )
}

function parse(name, body) {
  return ts.createSourceFile(name, body, ts.ScriptTarget.Latest, true, ts.ScriptKind.TSX)
}

function walk(node, visit) {
  visit(node)
  node.forEachChild((child) => walk(child, visit))
}

function line(node, source) {
  return source.getLineAndCharacterOfPosition(node.getStart(source)).line + 1
}

async function directories(root) {
  return (await readdir(root, { withFileTypes: true }))
    .filter((entry) => entry.isDirectory() && !entry.name.startsWith('_'))
    .map((entry) => entry.name)
    .sort()
}

async function exists(name) {
  try {
    await access(name)
    return true
  } catch {
    return false
  }
}
