/**
 * Test render helper for config-driven components.
 *
 * Uses react-test-renderer instead of @testing-library/react-native because
 * RNTL's CJS internals do require('react-native') which bypasses vi.mock.
 * react-test-renderer has no react-native dependency — it works with any stub.
 */
import React from 'react'
import { create, act } from 'react-test-renderer'
import { vi } from 'vitest'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { AppContextProvider } from '../../../src/ui/context/AppContext'
import { ScreenContextProvider } from '../../../src/ui/context/ScreenContext'
import { resolveTokens } from '../../../src/ui/tokens/resolve'
import type { ApiClient } from '../../../src/api/client'
import type { DesignTokens, TokenConfig } from '../../../src/ui/tokens/types'

// ── Stable test tokens ────────────────────────────────────────────────────────

const TEST_TOKEN_CONFIG: TokenConfig = { flavor: 'default' }
export const testTokens: DesignTokens = resolveTokens(TEST_TOKEN_CONFIG, 'light')

// ── Mock API client ───────────────────────────────────────────────────────────

export function makeTestApi(): ApiClient {
  return {
    get: vi.fn().mockResolvedValue({}),
    post: vi.fn().mockResolvedValue({}),
    put: vi.fn().mockResolvedValue({}),
    patch: vi.fn().mockResolvedValue({}),
    delete: vi.fn().mockResolvedValue({}),
    fetch: vi.fn().mockResolvedValue(new Response()),
  } as unknown as ApiClient
}

// ── Provider wrapper ──────────────────────────────────────────────────────────

interface ProvidersProps {
  children: React.ReactNode
  api?: ApiClient
  initialValues?: Record<string, unknown>
}

function Providers({ children, api, initialValues }: ProvidersProps) {
  const resolvedApi = api ?? makeTestApi()
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false }, mutations: { retry: false } },
  })
  return (
    <QueryClientProvider client={queryClient}>
      <AppContextProvider api={resolvedApi} tokens={testTokens} tokenConfig={TEST_TOKEN_CONFIG}>
        <ScreenContextProvider api={resolvedApi} initialValues={initialValues}>
          {children}
        </ScreenContextProvider>
      </AppContextProvider>
    </QueryClientProvider>
  )
}

// ── JSON tree query helpers ───────────────────────────────────────────────────

type JSONNode =
  | {
      type: string
      props: Record<string, unknown>
      children: (JSONNode | string)[] | null
    }
  | string
  | null

type JSONTree = JSONNode | JSONNode[]

function findAll(node: JSONTree, predicate: (n: JSONNode) => boolean): JSONNode[] {
  if (!node) return []
  if (Array.isArray(node)) {
    const results: JSONNode[] = []
    for (const child of node) results.push(...findAll(child, predicate))
    return results
  }
  const results: JSONNode[] = []
  if (predicate(node)) results.push(node)
  if (typeof node !== 'string' && node.children) {
    for (const child of node.children) {
      results.push(...findAll(child, predicate))
    }
  }
  return results
}

function getTextContent(node: JSONTree): string {
  if (!node) return ''
  if (Array.isArray(node)) return node.map(getTextContent).join('')
  if (typeof node === 'string') return node
  if (!node.children) return ''
  return node.children.map(getTextContent).join('')
}

export interface RenderResult {
  /** Find first element whose text content equals the given string. */
  getByText: (text: string) => JSONNode
  /** Find first element with a matching testID prop. */
  getByTestId: (testId: string) => JSONNode
  /** Find first element with a matching accessibilityRole. */
  getByRole: (role: string) => JSONNode
  /** Returns the full JSON output of the rendered tree. */
  toJSON: () => JSONTree
  /** The raw react-test-renderer instance. */
  instance: ReturnType<typeof create>
}

// ── renderWithProviders ───────────────────────────────────────────────────────

export function renderWithProviders(
  ui: React.ReactElement,
  options?: { api?: ApiClient; initialValues?: Record<string, unknown> },
): RenderResult {
  let instance!: ReturnType<typeof create>

  act(() => {
    instance = create(
      <Providers api={options?.api} initialValues={options?.initialValues}>
        {ui}
      </Providers>,
    )
  })

  const toJSON = () => instance.toJSON() as JSONTree

  return {
    toJSON,
    instance,
    getByText(text: string) {
      const nodes = findAll(toJSON(), (n) => typeof n !== 'string' && getTextContent(n) === text)
      if (nodes.length === 0) throw new Error(`Unable to find element with text: "${text}"`)
      return nodes[0]!
    },
    getByTestId(testId: string) {
      const nodes = findAll(
        toJSON(),
        (n) => typeof n !== 'string' && n !== null && n.props?.testID === testId,
      )
      if (nodes.length === 0) throw new Error(`Unable to find element with testID: "${testId}"`)
      return nodes[0]!
    },
    getByRole(role: string) {
      const nodes = findAll(
        toJSON(),
        (n) =>
          typeof n !== 'string' &&
          n !== null &&
          (n.props?.accessibilityRole === role || n.props?.role === role),
      )
      if (nodes.length === 0) throw new Error(`Unable to find element with role: "${role}"`)
      return nodes[0]!
    },
  }
}
