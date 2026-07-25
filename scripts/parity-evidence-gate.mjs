import { access, readFile, stat } from 'node:fs/promises'

const root = new URL('../', import.meta.url)
const ledger = JSON.parse(
  await readFile(new URL('docs/product-parity-evidence.json', root), 'utf8'),
)
const products = ['hitshot', 'aicoach', 'sgforum', 'burndown', 'blankslate']
const statuses = new Set(['implemented', 'app-owned', 'device-proof', 'external'])
const failures = []
const ids = new Set()

for (const requirement of ledger.requirements ?? []) {
  if (!requirement.id || ids.has(requirement.id))
    failures.push(`invalid or duplicate id: ${requirement.id}`)
  ids.add(requirement.id)
  if (!statuses.has(requirement.status)) failures.push(`${requirement.id} has invalid status`)
  if (!products.includes(requirement.product) && requirement.product !== 'cross-product') {
    failures.push(`${requirement.id} has invalid product`)
  }
  if (!Array.isArray(requirement.evidence) || requirement.evidence.length === 0) {
    failures.push(`${requirement.id} has no evidence`)
    continue
  }
  for (const path of requirement.evidence) {
    if (path.startsWith('/') || path.includes('..')) {
      failures.push(`${requirement.id} uses an unsafe evidence path: ${path}`)
      continue
    }
    try {
      await access(new URL(path, root))
      const details = await stat(new URL(path, root))
      if (!details.isFile() && !details.isDirectory()) failures.push(`${path} is not inspectable`)
    } catch {
      failures.push(`${requirement.id} evidence does not exist: ${path}`)
    }
  }
}

for (const product of products) {
  const entries = ledger.requirements.filter((item) => item.product === product)
  if (!entries.some((item) => item.status === 'implemented')) {
    failures.push(`${product} has no implemented capability evidence`)
  }
  if (!entries.some((item) => item.status === 'device-proof')) {
    failures.push(`${product} has no native release-proof classification`)
  }
}

if (failures.length) {
  console.error(`Parity evidence gate failed:\n- ${failures.join('\n- ')}`)
  process.exit(1)
}

const totals = Object.fromEntries(
  [...statuses].map((status) => [
    status,
    ledger.requirements.filter((item) => item.status === status).length,
  ]),
)
console.log(
  `Parity evidence gate passes (${ledger.requirements.length} groups: ${JSON.stringify(totals)}).`,
)
