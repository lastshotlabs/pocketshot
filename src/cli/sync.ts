import fs from 'node:fs/promises'
import path from 'node:path'
import { createHash } from 'node:crypto'
import { log, spinner } from '@clack/prompts'

// ─── OpenAPI 3.x types (minimal) ─────────────────────────────────────────────

interface OpenAPISchema {
  openapi: string
  info: { title: string; version: string }
  paths: Record<string, PathItem>
  components?: {
    schemas?: Record<string, SchemaObject>
  }
}

interface PathItem {
  get?: Operation
  post?: Operation
  put?: Operation
  patch?: Operation
  delete?: Operation
  parameters?: Parameter[]
}

interface Operation {
  operationId?: string
  tags?: string[]
  summary?: string
  description?: string
  parameters?: Parameter[]
  requestBody?: RequestBody
  responses: Record<string, ResponseObj>
  deprecated?: boolean
}

interface Parameter {
  name: string
  in: 'path' | 'query' | 'header' | 'cookie'
  required?: boolean
  schema?: SchemaObject
  description?: string
}

interface RequestBody {
  required?: boolean
  description?: string
  content: Record<string, { schema?: SchemaObject }>
}

interface ResponseObj {
  description?: string
  content?: Record<string, { schema?: SchemaObject }>
}

interface SchemaObject {
  type?: string | string[]
  properties?: Record<string, SchemaObject>
  items?: SchemaObject
  required?: string[]
  $ref?: string
  oneOf?: SchemaObject[]
  anyOf?: SchemaObject[]
  allOf?: SchemaObject[]
  enum?: (string | number | boolean | null)[]
  additionalProperties?: boolean | SchemaObject
  nullable?: boolean
  description?: string
  format?: string
  title?: string
  default?: unknown
}

// ─── Logger ───────────────────────────────────────────────────────────────────

export interface SyncLogger {
  info(msg: string): void
  success(msg: string): void
  warn(msg: string): void
  error(msg: string): void
}

const clackLogger: SyncLogger = {
  info: (msg) => log.info(msg),
  success: (msg) => log.success(msg),
  warn: (msg) => log.warn(msg),
  error: (msg) => log.error(msg),
}

export const consoleLogger: SyncLogger = {
  info: (msg) => console.log(`[pocketshot] ${msg}`),
  success: (msg) => console.log(`[pocketshot] ✓ ${msg}`),
  warn: (msg) => console.warn(`[pocketshot] ⚠ ${msg}`),
  error: (msg) => console.error(`[pocketshot] ✗ ${msg}`),
}

// ─── Sync config ──────────────────────────────────────────────────────────────

export interface BackendConfig {
  name?: string
  apiUrl?: string
  filePath?: string
  apiDir?: string
  hooksDir?: string
  typesPath?: string
  pocketshotImport?: string
  zod?: boolean
}

interface SyncConfig {
  // Flat single-backend fields (backward compat)
  apiDir?: string
  hooksDir?: string
  typesPath?: string
  pocketshotImport?: string
  // Multi-backend
  backends?: BackendConfig[]
}

async function readSyncConfig(cwd: string): Promise<SyncConfig> {
  try {
    const content = await fs.readFile(path.join(cwd, 'pocketshot.config.json'), 'utf8')
    return JSON.parse(content) as SyncConfig
  } catch {
    /* not found */
  }
  try {
    const content = await fs.readFile(path.join(cwd, 'package.json'), 'utf8')
    const pkg = JSON.parse(content) as { pocketshot?: SyncConfig }
    return pkg.pocketshot ?? {}
  } catch {
    /* not found */
  }
  return {}
}

/** Derives default output dirs for a backend, using name-based paths in multi-backend mode. */
function resolveBackendDirs(
  cwd: string,
  backend: BackendConfig,
  globalOpts: Pick<SyncOptions, 'apiDir' | 'hooksDir' | 'typesPath' | 'pocketshotImport'>,
  isMulti: boolean,
): { apiDir: string; hooksDir: string; typesFile: string; pocketshotImport: string } {
  let defaultApiDir: string
  let defaultHooksDir: string
  let defaultTypesPath: string

  if (isMulti && backend.name) {
    const slug = backend.name.toLowerCase().replace(/[^a-z0-9]+/g, '-')
    defaultApiDir = `src/api/${slug}`
    defaultHooksDir = `src/hooks/${slug}`
    defaultTypesPath = `src/types/${slug}-api.ts`
  } else {
    defaultApiDir = 'src/api'
    defaultHooksDir = 'src/hooks/api'
    defaultTypesPath = 'src/types/api.ts'
  }

  return {
    apiDir: path.resolve(cwd, backend.apiDir ?? globalOpts.apiDir ?? defaultApiDir),
    hooksDir: path.resolve(cwd, backend.hooksDir ?? globalOpts.hooksDir ?? defaultHooksDir),
    typesFile: path.resolve(cwd, backend.typesPath ?? globalOpts.typesPath ?? defaultTypesPath),
    pocketshotImport: backend.pocketshotImport ?? globalOpts.pocketshotImport ?? '@/lib/pocketshot',
  }
}

/** Computes a relative import path from a source directory to a target file/dir, stripping `.ts` extension. */
function toRelativeImport(fromDir: string, toPath: string): string {
  let rel = path.relative(fromDir, toPath).replace(/\\/g, '/')
  if (!rel.startsWith('.')) rel = './' + rel
  return rel.replace(/\.ts$/, '')
}

// ─── Schema hash ──────────────────────────────────────────────────────────────

function schemaHash(schema: OpenAPISchema): string {
  return createHash('sha1').update(JSON.stringify(schema)).digest('hex')
}

// ─── Schema → TypeScript ──────────────────────────────────────────────────────

function refName(ref: string): string {
  return ref.replace('#/components/schemas/', '')
}

function collectRefs(schema: SchemaObject): Set<string> {
  const refs = new Set<string>()
  if (schema.$ref) {
    refs.add(refName(schema.$ref))
    return refs
  }
  if (schema.items) collectRefs(schema.items).forEach((r) => refs.add(r))
  if (schema.properties) {
    for (const prop of Object.values(schema.properties)) {
      collectRefs(prop).forEach((r) => refs.add(r))
    }
  }
  for (const arr of [schema.oneOf, schema.anyOf, schema.allOf]) {
    if (arr) for (const s of arr) collectRefs(s).forEach((r) => refs.add(r))
  }
  return refs
}

function schemaToTs(schema: SchemaObject, depth = 0): string {
  if (schema.$ref) return refName(schema.$ref)

  if (schema.enum) {
    return schema.enum
      .map((v) => (v === null ? 'null' : typeof v === 'string' ? `'${v}'` : String(v)))
      .join(' | ')
  }

  if (schema.allOf) {
    const parts = schema.allOf.map((s) => schemaToTs(s, depth))
    return parts.length === 1 ? parts[0]! : parts.join(' & ')
  }

  if (schema.oneOf || schema.anyOf) {
    return (schema.oneOf ?? schema.anyOf)!.map((s) => schemaToTs(s, depth)).join(' | ')
  }

  const types = Array.isArray(schema.type) ? schema.type : schema.type ? [schema.type] : []
  const isNullable = schema.nullable === true || types.includes('null')
  const baseTypes = types.filter((t) => t !== 'null')

  let base: string

  if (baseTypes.includes('array') || schema.items) {
    const item = schema.items ? schemaToTs(schema.items, depth) : 'unknown'
    base = item.includes(' | ') ? `(${item})[]` : `${item}[]`
  } else if (baseTypes.includes('object') || schema.properties || schema.additionalProperties) {
    if (schema.properties && Object.keys(schema.properties).length > 0) {
      const ind = '  '.repeat(depth + 1)
      const close = '  '.repeat(depth)
      const lines = Object.entries(schema.properties).map(([key, val]) => {
        const opt = schema.required?.includes(key) ? '' : '?'
        const valNull = val.nullable ? ' | null' : ''
        const safeProp = /[^a-zA-Z0-9_$]/.test(key) ? `'${key}'` : key
        return `${ind}${safeProp}${opt}: ${schemaToTs(val, depth + 1)}${valNull}`
      })
      base = `{\n${lines.join('\n')}\n${close}}`
    } else if (schema.additionalProperties && typeof schema.additionalProperties === 'object') {
      base = `Record<string, ${schemaToTs(schema.additionalProperties, depth)}>`
    } else {
      base = 'Record<string, unknown>'
    }
  } else if (baseTypes.includes('string')) {
    base = 'string'
  } else if (baseTypes.includes('integer') || baseTypes.includes('number')) {
    base = 'number'
  } else if (baseTypes.includes('boolean')) {
    base = 'boolean'
  } else {
    base = 'unknown'
  }

  return isNullable ? `${base} | null` : base
}

// ─── Schema → Zod ─────────────────────────────────────────────────────────────

function schemaToZod(
  schema: SchemaObject,
  componentSchemas: Record<string, SchemaObject>,
  visiting = new Set<string>(),
): string {
  if (schema.$ref) {
    const name = refName(schema.$ref)
    if (visiting.has(name)) return 'z.unknown()' // cycle guard
    const resolved = componentSchemas[name]
    return resolved
      ? schemaToZod(resolved, componentSchemas, new Set([...visiting, name]))
      : 'z.unknown()'
  }

  if (schema.enum) {
    const allStrings = schema.enum.every((v) => typeof v === 'string')
    if (allStrings && schema.enum.length > 0) {
      return `z.enum([${schema.enum.map((v) => `'${v}'`).join(', ')}])`
    }
    const literals = schema.enum.map((v) =>
      v === null ? 'z.null()' : `z.literal(${typeof v === 'string' ? `'${v}'` : String(v)})`,
    )
    return `z.union([${literals.join(', ')}])`
  }

  if (schema.allOf) {
    if (schema.allOf.length === 1) return schemaToZod(schema.allOf[0]!, componentSchemas, visiting)
    const parts = schema.allOf.map((s) => schemaToZod(s, componentSchemas, visiting))
    return parts.reduce((acc, cur) => `z.intersection(${acc}, ${cur})`)
  }

  if (schema.oneOf || schema.anyOf) {
    const arr = (schema.oneOf ?? schema.anyOf)!
    return `z.union([${arr.map((s) => schemaToZod(s, componentSchemas, visiting)).join(', ')}])`
  }

  const types = Array.isArray(schema.type) ? schema.type : schema.type ? [schema.type] : []
  const isNullable = schema.nullable === true || types.includes('null')
  const baseTypes = types.filter((t) => t !== 'null')

  let base: string

  if (baseTypes.includes('array') || schema.items) {
    const item = schema.items
      ? schemaToZod(schema.items, componentSchemas, visiting)
      : 'z.unknown()'
    base = `z.array(${item})`
  } else if (baseTypes.includes('object') || schema.properties || schema.additionalProperties) {
    if (schema.properties && Object.keys(schema.properties).length > 0) {
      const props = Object.entries(schema.properties).map(([key, val]) => {
        const zodVal = schemaToZod(val, componentSchemas, visiting)
        const nullable = val.nullable ? '.nullable()' : ''
        const opt = schema.required?.includes(key) ? '' : '.optional()'
        const safeProp = /[^a-zA-Z0-9_$]/.test(key) ? `'${key}'` : key
        return `  ${safeProp}: ${zodVal}${nullable}${opt},`
      })
      base = `z.object({\n${props.join('\n')}\n})`
    } else if (schema.additionalProperties && typeof schema.additionalProperties === 'object') {
      base = `z.record(z.string(), ${schemaToZod(schema.additionalProperties, componentSchemas, visiting)})`
    } else {
      base = 'z.record(z.string(), z.unknown())'
    }
  } else if (baseTypes.includes('string')) {
    base = 'z.string()'
  } else if (baseTypes.includes('integer') || baseTypes.includes('number')) {
    base = 'z.number()'
  } else if (baseTypes.includes('boolean')) {
    base = 'z.boolean()'
  } else {
    base = 'z.unknown()'
  }

  return isNullable ? `${base}.nullable()` : base
}

// ─── Types file ───────────────────────────────────────────────────────────────

function generateTypesContent(
  schemas: Record<string, SchemaObject>,
  hasPaginated: boolean,
): string {
  const lines: string[] = ['// Generated by npx pocketshot sync. Do not edit manually.', '']

  if (hasPaginated) {
    lines.push(`export interface PaginatedResponse<T> {`)
    lines.push(`  data: T[]`)
    lines.push(`  total: number`)
    lines.push(`  page: number`)
    lines.push(`  perPage: number`)
    lines.push(`}`)
    lines.push('')
  }

  for (const [name, schema] of Object.entries(schemas)) {
    if (schema.description) lines.push(`/** ${schema.description} */`)

    const isObject =
      schema.type === 'object' ||
      !!schema.properties ||
      (Array.isArray(schema.type) && (schema.type as string[]).includes('object'))
    const isComplex = schema.enum || schema.oneOf || schema.anyOf || schema.allOf || schema.$ref

    if (isObject && !isComplex) {
      const ind = '  '
      const props = schema.properties
        ? Object.entries(schema.properties).map(([key, val]) => {
            const opt = schema.required?.includes(key) ? '' : '?'
            const valNull = val.nullable ? ' | null' : ''
            const comment = val.description ? `  /** ${val.description} */\n` : ''
            const safeProp = /[^a-zA-Z0-9_$]/.test(key) ? `'${key}'` : key
            return `${comment}${ind}${safeProp}${opt}: ${schemaToTs(val, 1)}${valNull}`
          })
        : []
      if (schema.additionalProperties && typeof schema.additionalProperties === 'object') {
        lines.push(`export interface ${name} extends Record<string, unknown> {`)
      } else {
        lines.push(`export interface ${name} {`)
      }
      lines.push(...props)
      lines.push('}')
    } else {
      lines.push(`export type ${name} = ${schemaToTs(schema)}`)
    }

    lines.push('')
  }

  return lines.join('\n')
}

// ─── Hook generation ──────────────────────────────────────────────────────────

interface TaggedOp {
  method: string
  pathStr: string
  operation: Operation
  pathLevelParams: Parameter[]
}

/** Converts a kebab-case or hyphenated string to camelCase. */
function toCamelCase(str: string): string {
  return str.replace(/[-_]([a-zA-Z0-9])/g, (_, c: string) => c.toUpperCase())
}

/** Derives the name for the plain async function export. operationId sanitized to camelCase when present. */
function plainFnName(method: string, pathStr: string, operationId?: string): string {
  if (operationId) return toCamelCase(operationId)
  const segs = pathStr
    .split('/')
    .filter(Boolean)
    .map((seg) => {
      if (seg.startsWith('{') && seg.endsWith('}')) {
        const n = seg.slice(1, -1)
        return 'By' + n.charAt(0).toUpperCase() + n.slice(1)
      }
      const camel = toCamelCase(seg)
      return camel.charAt(0).toUpperCase() + camel.slice(1)
    })
  return method + segs.join('')
}

function hookName(method: string, fnName: string): string {
  const isQuery = method === 'get'
  const pascal = fnName.charAt(0).toUpperCase() + fnName.slice(1)
  if (pascal.endsWith('Query') || pascal.endsWith('Mutation')) return `use${pascal}`
  return `use${pascal}${isQuery ? 'Query' : 'Mutation'}`
}

function successSchema(responses: Record<string, ResponseObj>): SchemaObject | null {
  for (const code of ['200', '201', '202']) {
    const r = responses[code]
    if (r?.content?.['application/json']?.schema) return r.content['application/json'].schema
  }
  return null
}

function requestBodySchema(rb?: RequestBody): SchemaObject | null {
  if (!rb) return null
  return rb.content?.['application/json']?.schema ?? null
}

/** Returns the non-JSON content type if the request body exists but has no application/json entry. */
function nonJsonBodyContentType(rb?: RequestBody): string | null {
  if (!rb?.content) return null
  if ('application/json' in rb.content) return null
  return Object.keys(rb.content)[0] ?? null
}

/** Template for plain async fns — bare arg names, no `params.` prefix */
function rawPathTemplate(pathStr: string, pathParams: Parameter[]): string {
  if (pathParams.length === 0) return `'${pathStr}'`
  const tpl = pathStr.replace(/\{([^}]+)\}/g, (_, n) => `\${${n}}`)
  return `\`${tpl}\``
}

/** URL template with pagination query string appended (always a template literal) */
function paginatedUrlTemplate(pathStr: string, pathParams: Parameter[]): string {
  if (pathParams.length === 0) {
    return `\`${pathStr}?page=\${page}&perPage=\${perPage}\``
  }
  const tpl = pathStr.replace(/\{([^}]+)\}/g, (_, n) => `\${${n}}`)
  return `\`${tpl}?page=\${page}&perPage=\${perPage}\``
}

function queryKey(pathStr: string, queryParams: Parameter[] = []): string {
  const parts = pathStr
    .split('/')
    .filter(Boolean)
    .map((seg) =>
      seg.startsWith('{') && seg.endsWith('}') ? `params.${seg.slice(1, -1)}` : `'${seg}'`,
    )
  for (const p of queryParams) {
    parts.push(`params.${p.name}`)
  }
  return `[${parts.join(', ')}]`
}

function paramType(p: Parameter): string {
  return schemaToTs(p.schema ?? { type: 'string' })
}

/** Detects bunshot's pagination envelope: { data: T[], total: number, ... } */
function isPaginatedSchema(schema: SchemaObject): { itemSchema: SchemaObject } | null {
  if (!schema.properties) return null
  const { data, total } = schema.properties
  // Accept array type OR items presence (handles $ref-typed arrays without explicit type)
  if (!data || (!data.items && data.type !== 'array')) return null
  if (!total || !['integer', 'number'].includes(total.type as string)) return null
  const itemSchema = data.items ?? {} // empty schema → schemaToTs returns 'unknown'
  return { itemSchema }
}

interface GeneratedOperation {
  apiCode: string // plain async function (no React deps)
  hookCode: string // TanStack Query hook
  fnNames: string[] // exported function names (for import in hooks file)
  isPaginated: boolean
}

/**
 * Generates the plain async function (api layer) and TanStack Query hook (hooks layer)
 * for a single OpenAPI operation, keeping them separate so each can be written to
 * its own file.
 */
function generateOperation(
  method: string,
  pathStr: string,
  op: Operation,
  pathLevelParams: Parameter[],
  componentSchemas: Record<string, SchemaObject>,
  zod?: boolean,
): GeneratedOperation {
  const isQuery = method === 'get'

  const allParams = [
    ...pathLevelParams,
    ...(op.parameters ?? []).filter(
      (p) => !pathLevelParams.find((pp) => pp.name === p.name && pp.in === p.in),
    ),
  ]
  const pathParams = allParams.filter((p) => p.in === 'path')
  const queryParams = allParams.filter((p) => p.in === 'query')
  const hasPathParams = pathParams.length > 0
  const hasQueryParams = queryParams.length > 0

  const fnName = plainFnName(method, pathStr, op.operationId)
  const name = hookName(method, fnName)

  const successSch = successSchema(op.responses)
  const paginatedResult = isQuery && successSch ? isPaginatedSchema(successSch) : null
  const isPaginated = paginatedResult !== null

  const respType = (() => {
    if (isPaginated && paginatedResult) {
      return `PaginatedResponse<${schemaToTs(paginatedResult.itemSchema)}>`
    }
    return successSch ? schemaToTs(successSch) : 'void'
  })()

  const bodyType = (() => {
    const s = requestBodySchema(op.requestBody)
    return s ? schemaToTs(s) : 'void'
  })()

  const hasBody = bodyType !== 'void'

  const nonJsonType = nonJsonBodyContentType(op.requestBody)
  const jsdocParts: string[] = []
  if (op.deprecated) jsdocParts.push('@deprecated')
  if (op.summary) jsdocParts.push(op.summary)
  if (nonJsonType) jsdocParts.push(`NOTE: request body is ${nonJsonType} — body typed as void`)
  const jsdoc = jsdocParts.length > 0 ? `/** ${jsdocParts.join(' — ')} */\n` : ''

  // ── Paginated GET ─────────────────────────────────────────────────────────
  if (isPaginated) {
    const pathArgsStr = pathParams.map((p) => `${p.name}: ${paramType(p)}`).join(', ')
    const pathArgsWithComma = pathArgsStr ? `${pathArgsStr}, ` : ''
    const paginatedUrl = paginatedUrlTemplate(pathStr, pathParams)

    const plainFn =
      `${jsdoc}export const ${fnName} = (${pathArgsWithComma}page = 1, perPage = 20): Promise<${respType}> =>\n` +
      `  api.get<${respType}>(${paginatedUrl})`

    const pathKeyParts = pathStr
      .split('/')
      .filter(Boolean)
      .map((seg) =>
        seg.startsWith('{') && seg.endsWith('}') ? `params.${seg.slice(1, -1)}` : `'${seg}'`,
      )
    const paginatedQueryKey = `[${[...pathKeyParts, 'params.page ?? 1', 'params.perPage ?? 20'].join(', ')}]`

    const paramsType = hasPathParams
      ? `{ ${pathParams.map((p) => `${p.name}: ${paramType(p)}`).join('; ')}; page?: number; perPage?: number }`
      : `{ page?: number; perPage?: number }`

    const callPathArgs = pathParams.map((p) => `params.${p.name}`).join(', ')
    const callAllArgs = callPathArgs
      ? `${callPathArgs}, params.page ?? 1, params.perPage ?? 20`
      : `params.page ?? 1, params.perPage ?? 20`

    const hookLines: string[] = []
    if (jsdocParts.length > 0) hookLines.push(`/** ${jsdocParts.join(' — ')} */`)
    hookLines.push(`export function ${name}(`)
    hookLines.push(`  params: ${paramsType} = {},`)
    hookLines.push(
      `  options?: Omit<UseQueryOptions<${respType}, ApiError>, 'queryKey' | 'queryFn'>`,
    )
    hookLines.push(`) {`)
    hookLines.push(`  return useQuery({`)
    hookLines.push(`    queryKey: ${paginatedQueryKey},`)
    hookLines.push(`    queryFn: () => ${fnName}(${callAllArgs}),`)
    hookLines.push(`    ...options,`)
    hookLines.push(`  })`)
    hookLines.push(`}`)

    return {
      apiCode: plainFn,
      hookCode: hookLines.join('\n'),
      fnNames: [fnName],
      isPaginated: true,
    }
  }

  // ── Plain function (layer 1) ──────────────────────────────────────────────
  const fnArgParts = [
    ...pathParams.map((p) => `${p.name}: ${paramType(p)}`),
    ...(!isQuery && hasBody ? [`body: ${bodyType}`] : []),
    ...queryParams.map((p) => `${p.name}${p.required ? '' : '?'}: ${paramType(p)}`),
  ]
  const fnArgs = fnArgParts.join(', ')

  let plainFn: string
  if (hasQueryParams) {
    const pathTpl = pathStr.replace(/\{([^}]+)\}/g, (_, n) => `\${${n}}`)
    const qSetLines = queryParams.map((p) =>
      p.required
        ? `  _q.set('${p.name}', String(${p.name}))`
        : `  if (${p.name} != null) _q.set('${p.name}', String(${p.name}))`,
    )
    const urlExpr = `\`${pathTpl}?\${_q}\``
    const needsBody = method !== 'get' && method !== 'delete'
    const returnCall = hasBody
      ? `return api.${method}<${respType}>(${urlExpr}, body)`
      : needsBody
        ? `return api.${method}<${respType}>(${urlExpr}, undefined)`
        : `return api.${method}<${respType}>(${urlExpr})`
    plainFn =
      `${jsdoc}export const ${fnName} = (${fnArgs}): Promise<${respType}> => {\n` +
      `  const _q = new URLSearchParams()\n` +
      qSetLines.join('\n') +
      '\n' +
      `  ${returnCall}\n` +
      `}`
  } else {
    const rawUrl = rawPathTemplate(pathStr, pathParams)
    const needsBody = method !== 'get' && method !== 'delete'
    const apiCall = hasBody
      ? `api.${method}<${respType}>(${rawUrl}, body)`
      : needsBody
        ? `api.${method}<${respType}>(${rawUrl}, undefined)`
        : `api.${method}<${respType}>(${rawUrl})`
    plainFn = `${jsdoc}export const ${fnName} = (${fnArgs}): Promise<${respType}> =>\n  ${apiCall}`
  }

  // ── Hook (layer 2) ────────────────────────────────────────────────────────
  const lines: string[] = []
  if (jsdocParts.length > 0) lines.push(`/** ${jsdocParts.join(' — ')} */`)

  if (isQuery) {
    const paramFields = [
      ...pathParams.map((p) => `${p.name}: ${paramType(p)}`),
      ...queryParams.map((p) => `${p.name}${p.required ? '' : '?'}: ${paramType(p)}`),
    ]
    const hasAnyParams = paramFields.length > 0
    const allParamsOptional = pathParams.length === 0 && queryParams.every((p) => !p.required)
    const paramsDefault = hasAnyParams && allParamsOptional ? ' = {}' : ''
    const paramsArg = hasAnyParams ? `params: { ${paramFields.join('; ')} }${paramsDefault}, ` : ''
    const allCallArgs = [
      ...pathParams.map((p) => `params.${p.name}`),
      ...queryParams.map((p) => `params.${p.name}`),
    ]
    lines.push(`export function ${name}(`)
    lines.push(
      `  ${paramsArg}options?: Omit<UseQueryOptions<${respType}, ApiError>, 'queryKey' | 'queryFn'>`,
    )
    lines.push(`) {`)
    lines.push(`  return useQuery({`)
    lines.push(`    queryKey: ${queryKey(pathStr, queryParams)},`)
    if (allCallArgs.length > 0) {
      lines.push(`    queryFn: () => ${fnName}(${allCallArgs.join(', ')}),`)
    } else {
      lines.push(`    queryFn: ${fnName},`)
    }
    lines.push(`    ...options,`)
    lines.push(`  })`)
    lines.push(`}`)
  } else {
    let variablesType: string
    let mutationFnExpr: string

    const mutationQueryFields = queryParams.map(
      (p) => `${p.name}${p.required ? '' : '?'}: ${paramType(p)}`,
    )
    const queryCallArgs = queryParams.map((p) => `vars.${p.name}`)

    if (!hasPathParams && !hasBody && !hasQueryParams) {
      variablesType = 'void'
      mutationFnExpr = `() => ${fnName}()`
    } else if (!hasPathParams && !hasQueryParams) {
      variablesType = bodyType
      mutationFnExpr = fnName
    } else {
      const fields = [
        ...pathParams.map((p) => `${p.name}: ${paramType(p)}`),
        ...(hasBody ? [`body: ${bodyType}`] : []),
        ...mutationQueryFields,
      ]
      variablesType = `{ ${fields.join('; ')} }`
      const callArgs = [
        ...pathParams.map((p) => `vars.${p.name}`),
        ...(hasBody ? [`vars.body`] : []),
        ...queryCallArgs,
      ]
      mutationFnExpr = `(vars) => ${fnName}(${callArgs.join(', ')})`
    }

    lines.push(`export function ${name}(`)
    lines.push(
      `  options?: UseMutationOptions<${respType}, ApiError, ${variablesType}> & { invalidateKeys?: QueryKey[] }`,
    )
    lines.push(`) {`)
    lines.push(`  const { invalidateKeys, ...mutationOptions } = options ?? {}`)
    lines.push(`  const queryClient = useQueryClient()`)
    lines.push(`  return useMutation({`)
    lines.push(`    mutationFn: ${mutationFnExpr},`)
    lines.push(`    ...mutationOptions,`)
    lines.push(`    onSuccess: (...args) => {`)
    lines.push(
      `      invalidateKeys?.forEach((key) => queryClient.invalidateQueries({ queryKey: key }))`,
    )
    lines.push(`      mutationOptions.onSuccess?.(...args)`)
    lines.push(`    },`)
    lines.push(`  })`)
    lines.push(`}`)
  }

  // ── Zod schema (mutations with JSON body only) — lives in the api file ──────
  const apiParts: string[] = [plainFn]

  if (!isQuery && hasBody && zod) {
    const bodySchema = requestBodySchema(op.requestBody)
    if (bodySchema) {
      const zodSchemaName = `${fnName}Schema`
      const zodTypeName = fnName.charAt(0).toUpperCase() + fnName.slice(1) + 'Input'
      const zodSchemaStr = schemaToZod(bodySchema, componentSchemas)
      apiParts.push(
        `/** Zod schema for ${name} form validation */\n` +
          `export const ${zodSchemaName} = ${zodSchemaStr}\n` +
          `export type ${zodTypeName} = z.infer<typeof ${zodSchemaName}>`,
      )
    }
  }

  return {
    apiCode: apiParts.join('\n\n'),
    hookCode: lines.join('\n'),
    fnNames: [fnName],
    isPaginated: false,
  }
}

interface ImportPaths {
  pocketshotImport: string // e.g. '@/lib/pocketshot'
  typesRelForApi: string // e.g. '../types/api'
  typesRelForHooks: string // e.g. '../../types/api'
  apiRelBase: string // e.g. '../../api'
}

interface GeneratedTagFiles {
  apiContent: string
  hooksContent: string
  hasPaginated: boolean
}

function collectTagRefs(ops: TaggedOp[]): Set<string> {
  const typeRefs = new Set<string>()
  for (const { operation, pathLevelParams } of ops) {
    const s = successSchema(operation.responses)
    if (s) collectRefs(s).forEach((r) => typeRefs.add(r))
    const b = requestBodySchema(operation.requestBody)
    if (b) collectRefs(b).forEach((r) => typeRefs.add(r))
    for (const p of [...(operation.parameters ?? []), ...pathLevelParams]) {
      if (p.schema) collectRefs(p.schema).forEach((r) => typeRefs.add(r))
    }
  }
  // Paginated item schemas
  for (const { method, operation } of ops) {
    if (method !== 'get') continue
    const s = successSchema(operation.responses)
    if (!s) continue
    const pagResult = isPaginatedSchema(s)
    if (pagResult) collectRefs(pagResult.itemSchema).forEach((r) => typeRefs.add(r))
  }
  return typeRefs
}

function generateTagFiles(
  ops: TaggedOp[],
  slug: string,
  componentSchemas: Record<string, SchemaObject>,
  zod?: boolean,
  importPaths?: ImportPaths,
): GeneratedTagFiles {
  const ip: ImportPaths = importPaths ?? {
    pocketshotImport: '@/lib/pocketshot',
    typesRelForApi: '../types/api',
    typesRelForHooks: '../../types/api',
    apiRelBase: '../../api',
  }

  const typeRefs = collectTagRefs(ops)

  const generated = ops.map(({ method, pathStr, operation, pathLevelParams }) =>
    generateOperation(method, pathStr, operation, pathLevelParams, componentSchemas, zod),
  )

  const hasPaginated = generated.some((g) => g.isPaginated)
  const hasZod = zod && generated.some((g) => g.apiCode.includes('z.infer'))
  const allFnNames = generated.flatMap((g) => g.fnNames)

  const localTypeImports: string[] = [...typeRefs].sort()
  if (hasPaginated) localTypeImports.unshift('PaginatedResponse')

  // ── API file (src/api/{slug}.ts) ──────────────────────────────────────────
  const apiLines: string[] = [
    '// Generated by npx pocketshot sync. Do not edit manually.',
    '',
    `import { api } from '${ip.pocketshotImport}'`,
  ]
  if (hasZod) apiLines.push("import { z } from 'zod'")
  if (localTypeImports.length > 0) {
    apiLines.push(`import type { ${localTypeImports.join(', ')} } from '${ip.typesRelForApi}'`)
  }
  apiLines.push('')
  for (const { apiCode } of generated) {
    apiLines.push(apiCode)
    apiLines.push('')
  }

  // ── Hooks file (src/hooks/api/{slug}.ts) ─────────────────────────────────
  const hasQueries = ops.some(({ method }) => method === 'get')
  const hasMutations = ops.some(({ method }) => method !== 'get')
  const rqImports: string[] = []
  if (hasQueries) rqImports.push('useQuery', 'type UseQueryOptions')
  if (hasMutations)
    rqImports.push('useMutation', 'useQueryClient', 'type UseMutationOptions', 'type QueryKey')

  const hooksLines: string[] = [
    '// Generated by npx pocketshot sync. Do not edit manually.',
    '',
    `import { ${rqImports.join(', ')} } from '@tanstack/react-query'`,
    "import { ApiError } from '@lastshotlabs/pocketshot'",
    `import { ${allFnNames.join(', ')} } from '${ip.apiRelBase}/${slug}'`,
  ]
  if (localTypeImports.length > 0) {
    hooksLines.push(`import type { ${localTypeImports.join(', ')} } from '${ip.typesRelForHooks}'`)
  }
  hooksLines.push('')
  for (const { hookCode } of generated) {
    hooksLines.push(hookCode)
    hooksLines.push('')
  }

  return {
    apiContent: apiLines.join('\n'),
    hooksContent: hooksLines.join('\n'),
    hasPaginated,
  }
}

// ─── .env reader ─────────────────────────────────────────────────────────────

async function readEnvUrl(cwd: string): Promise<string | undefined> {
  try {
    const content = await fs.readFile(path.join(cwd, '.env'), 'utf8')
    for (const line of content.split('\n')) {
      const m = line.match(/^EXPO_PUBLIC_API_URL\s*=\s*(.+)$/)
      if (m) return m[1]!.trim().replace(/^["']|["']$/g, '')
    }
  } catch {
    // .env doesn't exist or can't be read
  }
  return undefined
}

// ─── Schema loader ────────────────────────────────────────────────────────────

async function loadSchema(opts: SyncOptions): Promise<OpenAPISchema> {
  if (opts.filePath) {
    const abs = path.resolve(opts.cwd, opts.filePath)
    const content = await fs.readFile(abs, 'utf8')
    return JSON.parse(content) as OpenAPISchema
  }

  let apiUrl = opts.apiUrl ?? process.env['EXPO_PUBLIC_API_URL'] ?? (await readEnvUrl(opts.cwd))

  if (!apiUrl) {
    throw new Error(
      'No API URL found. Pass --api <url>, --file <path>, or set EXPO_PUBLIC_API_URL in .env',
    )
  }

  apiUrl = apiUrl.replace(/\/$/, '')

  const res = await fetch(`${apiUrl}/openapi.json`)
  if (!res.ok) {
    const err = new Error(`Server returned ${res.status} for ${apiUrl}/openapi.json`)
    ;(err as Error & { status: number }).status = res.status
    throw err
  }
  return (await res.json()) as OpenAPISchema
}

// ─── Main ─────────────────────────────────────────────────────────────────────

export interface SyncOptions {
  apiUrl?: string
  filePath?: string
  cwd: string
  watch?: boolean
  zod?: boolean
  apiDir?: string
  hooksDir?: string
  typesPath?: string
  pocketshotImport?: string
  /** Logger implementation. Defaults to clack (terminal UI). Pass consoleLogger for custom use. */
  logger?: SyncLogger
}

async function runSyncOnce(
  opts: SyncOptions,
  logger: SyncLogger,
  backend: BackendConfig,
  isMulti: boolean,
): Promise<void> {
  const { cwd } = opts

  const sp = spinner()

  // ── Load schema ───────────────────────────────────────────────────────────
  let schema: OpenAPISchema

  const effectiveFilePath = backend.filePath ?? opts.filePath
  if (effectiveFilePath) {
    sp.start(`Reading schema from ${effectiveFilePath}`)
  } else {
    sp.start('Fetching schema...')
  }

  try {
    schema = await loadSchema({
      ...opts,
      apiUrl: backend.apiUrl ?? opts.apiUrl,
      filePath: backend.filePath ?? opts.filePath,
    })
  } catch (err) {
    sp.stop('Failed')
    const msg = err instanceof Error ? err.message : String(err)
    logger.error(msg)
    if (err instanceof Error && 'status' in err) {
      const status = (err as Error & { status: number }).status
      if (status === 401 || status === 403) {
        logger.info('Tip: check your bunshot config — /openapi.json may require authentication')
      }
    }
    throw err
  }

  const title = schema.info?.title ?? 'API'
  const version = schema.info?.version ?? ''
  sp.stop(`Schema: ${title}${version ? ` ${version}` : ''}`)

  const componentSchemas = schema.components?.schemas ?? {}

  // ── Group operations by tag ───────────────────────────────────────────────
  const byTag = new Map<string, TaggedOp[]>()

  for (const [pathStr, pathItem] of Object.entries(schema.paths ?? {})) {
    const pathLevelParams: Parameter[] = pathItem.parameters ?? []

    for (const method of ['get', 'post', 'put', 'patch', 'delete'] as const) {
      const operation = pathItem[method]
      if (!operation) continue
      const tag = operation.tags?.[0] ?? 'index'
      if (!byTag.has(tag)) byTag.set(tag, [])
      byTag.get(tag)!.push({ method, pathStr, operation, pathLevelParams })
    }
  }

  // ── Generate hook files ───────────────────────────────────────────────────
  if (byTag.size === 0) {
    logger.warn('No operations found in schema — no hook files generated')
    // Still write the types file (may have component schemas)
  }

  const { apiDir, hooksDir, typesFile, pocketshotImport } = resolveBackendDirs(
    cwd,
    backend,
    opts,
    isMulti,
  )

  const importPaths: ImportPaths = {
    pocketshotImport,
    typesRelForApi: toRelativeImport(apiDir, typesFile),
    typesRelForHooks: toRelativeImport(hooksDir, typesFile),
    apiRelBase: toRelativeImport(hooksDir, apiDir),
  }

  await fs.mkdir(apiDir, { recursive: true })
  await fs.mkdir(hooksDir, { recursive: true })
  await fs.mkdir(path.dirname(typesFile), { recursive: true })

  let globalHasPaginated = false

  for (const [tag, ops] of byTag.entries()) {
    const slug = tag
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-|-$/g, '')
    const fileName = `${slug}.ts`
    const { apiContent, hooksContent, hasPaginated } = generateTagFiles(
      ops,
      slug,
      componentSchemas,
      backend.zod ?? opts.zod,
      importPaths,
    )
    if (hasPaginated) globalHasPaginated = true
    await fs.writeFile(path.join(apiDir, fileName), apiContent, 'utf8')
    await fs.writeFile(path.join(hooksDir, fileName), hooksContent, 'utf8')
    const apiRel = path.relative(cwd, path.join(apiDir, fileName)).replace(/\\/g, '/')
    const hooksRel = path.relative(cwd, path.join(hooksDir, fileName)).replace(/\\/g, '/')
    logger.success(`${apiRel} + ${hooksRel} — ${ops.length} operation(s)`)
  }

  // ── Write types file ──────────────────────────────────────────────────────
  const schemaCount = Object.keys(componentSchemas).length
  if (schemaCount === 0) {
    const exists = await fs
      .access(typesFile)
      .then(() => true)
      .catch(() => false)
    if (exists) {
      const typesRel = path.relative(cwd, typesFile).replace(/\\/g, '/')
      logger.warn(`${typesRel} — 0 schemas in spec, keeping existing file`)
    }
  } else {
    const typesContent = generateTypesContent(componentSchemas, globalHasPaginated)
    await fs.writeFile(typesFile, typesContent, 'utf8')
    const typesRel = path.relative(cwd, typesFile).replace(/\\/g, '/')
    logger.success(`${typesRel} — ${schemaCount} type(s)`)
  }
}

export async function runSync(opts: SyncOptions): Promise<void> {
  const logger = opts.logger ?? clackLogger
  const fileConfig = await readSyncConfig(opts.cwd)

  const backends: BackendConfig[] =
    fileConfig.backends && fileConfig.backends.length > 0 ? fileConfig.backends : [fileConfig]
  const isMulti = !!(fileConfig.backends && fileConfig.backends.length > 0)

  const runAll = async () => {
    for (const backend of backends) {
      if (isMulti && backend.name) logger.info(`── ${backend.name} ──`)
      await runSyncOnce(opts, logger, backend, isMulti)
    }
  }

  await runAll()

  if (!opts.watch) return

  logger.info('Watching for schema changes... (Ctrl+C to stop)')

  // Seed hashes per backend
  const lastHashes = new Map<number, string>()
  for (let i = 0; i < backends.length; i++) {
    const b = backends[i]!
    try {
      const schema = await loadSchema({
        ...opts,
        apiUrl: b.apiUrl ?? opts.apiUrl,
        filePath: b.filePath ?? opts.filePath,
      })
      lastHashes.set(i, schemaHash(schema))
    } catch {
      lastHashes.set(i, '')
    }
  }

  const pollMs = backends.some((b) => b.filePath ?? opts.filePath) ? 1000 : 3000

  const interval = setInterval(async () => {
    for (let i = 0; i < backends.length; i++) {
      const b = backends[i]!
      try {
        const schema = await loadSchema({
          ...opts,
          apiUrl: b.apiUrl ?? opts.apiUrl,
          filePath: b.filePath ?? opts.filePath,
        })
        const h = schemaHash(schema)
        if (h === lastHashes.get(i)) continue
        lastHashes.set(i, h)
        if (isMulti && b.name) logger.info(`── ${b.name} (changed) ──`)
        await runSyncOnce(opts, logger, b, isMulti)
      } catch (e) {
        logger.error(e instanceof Error ? e.message : String(e))
      }
    }
  }, pollMs)

  process.on('SIGINT', () => {
    clearInterval(interval)
    process.exit(0)
  })
}
