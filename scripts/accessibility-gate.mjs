import { readFile } from 'node:fs/promises'
import ts from 'typescript'

const products = ['hitshot', 'aicoach', 'sgforum', 'burndown', 'blankslate']
const failures = []
let interactiveControls = 0

for (const product of products) {
  const name = `products/${product}/app/index.tsx`
  const body = await readFile(new URL(`../${name}`, import.meta.url), 'utf8')
  const source = ts.createSourceFile(name, body, ts.ScriptTarget.Latest, true, ts.ScriptKind.TSX)
  walk(source, (node) => {
    if (!ts.isJsxOpeningElement(node) && !ts.isJsxSelfClosingElement(node)) return
    if (node.tagName.getText(source) !== 'Pressable') return
    interactiveControls += 1
    const attributes = new Set(
      node.attributes.properties
        .filter(ts.isJsxAttribute)
        .map((attribute) => attribute.name.getText(source)),
    )
    if (!attributes.has('accessibilityRole')) {
      failures.push(`${name}:${line(node, source)} Pressable is missing accessibilityRole`)
    }
    if (!attributes.has('accessibilityLabel')) {
      failures.push(`${name}:${line(node, source)} Pressable is missing accessibilityLabel`)
    }
  })
  const height = Number(/button:\s*\{[\s\S]*?minHeight:\s*(\d+)/.exec(body)?.[1] ?? 0)
  if (height < 44) failures.push(`${name} button touch target is below 44 points`)
}

if (interactiveControls === 0) failures.push('no interactive shell controls were inspected')
if (failures.length) {
  console.error(`Accessibility gate failed:\n- ${failures.join('\n- ')}`)
  process.exit(1)
}
console.log(
  `Accessibility gate passes (${interactiveControls} shell Pressables named; touch targets checked).`,
)

function walk(node, visit) {
  visit(node)
  node.forEachChild((child) => walk(child, visit))
}

function line(node, source) {
  return source.getLineAndCharacterOfPosition(node.getStart(source)).line + 1
}
