#!/usr/bin/env bun
/**
 * bun run sync
 *
 * Fetches the OpenAPI spec from the running bunshot server and generates
 * a typed TypeScript client at lib/generated/api.ts.
 *
 * Usage:
 *   EXPO_PUBLIC_API_URL=http://localhost:3000 bun run sync
 */

const API_URL = process.env.EXPO_PUBLIC_API_URL ?? 'http://localhost:3000'

async function main() {
  console.log(`Fetching OpenAPI spec from ${API_URL}/openapi.json ...`)

  const res = await fetch(`${API_URL}/openapi.json`)
  if (!res.ok) throw new Error(`Failed to fetch spec: ${res.status} ${res.statusText}`)

  const spec = await res.json()

  // Write raw spec for inspection / version control
  await Bun.write('lib/generated/openapi.json', JSON.stringify(spec, null, 2))

  // Generate typed client stub
  const routes = extractRoutes(spec)
  const clientCode = generateClient(routes)
  await Bun.write('lib/generated/api.ts', clientCode)

  console.log(`Generated ${routes.length} routes -> lib/generated/api.ts`)
}

interface Route {
  method: string
  path: string
  operationId: string
  requestBody?: boolean
  summary?: string
}

function extractRoutes(spec: any): Route[] {
  const routes: Route[] = []
  for (const [path, methods] of Object.entries(spec.paths ?? {})) {
    for (const [method, op] of Object.entries(methods as any)) {
      if (['get','post','put','patch','delete'].includes(method)) {
        routes.push({
          method: method.toUpperCase(),
          path,
          operationId: (op as any).operationId ?? `${method}_${path.replace(/\W/g, '_')}`,
          requestBody: !!(op as any).requestBody,
          summary: (op as any).summary,
        })
      }
    }
  }
  return routes
}

function generateClient(routes: Route[]): string {
  const lines = [
    `// AUTO-GENERATED — do not edit. Run \`bun run sync\` to regenerate.`,
    `import { apiFetch, apiGet, apiPost } from '../api'`,
    ``,
    `export const generatedApi = {`,
  ]
  for (const route of routes) {
    const fnName = route.operationId.replace(/[^a-zA-Z0-9]/g, '_').replace(/^_+/, '').replace(/_+$/, '')
    if (route.requestBody) {
      lines.push(`  ${fnName}: (body: unknown) => apiPost(\`${route.path.replace(/\{/g, '${params.')}\`, body),`)
    } else {
      lines.push(`  ${fnName}: () => apiGet(\`${route.path}\`),`)
    }
  }
  lines.push(`}`)
  return lines.join('\n')
}

main().catch(err => { console.error(err); process.exit(1) })
