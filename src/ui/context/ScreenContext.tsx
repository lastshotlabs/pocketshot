import React, { createContext, useCallback, useContext, useMemo, useRef, useState } from 'react'
import { useQueryClient } from '@tanstack/react-query'
import { useRouter } from 'expo-router'
import type { Action } from '../actions/types'
import { executeAction } from '../actions/executor'
import type { ApiClient } from '../../api/client'
import { useAppContext } from './AppContext'

export interface ScreenContextValue {
  /** Get a value stored in screen state by key. */
  getValue: (key: string) => unknown
  /** Set a value in screen state. */
  setValue: (key: string, value: unknown) => void
  /** Dispatch a config-driven action. */
  dispatch: (action: Action) => Promise<void>
  /** All current screen state values. */
  values: Record<string, unknown>
}

const ScreenContext = createContext<ScreenContextValue | null>(null)

interface ScreenContextProviderProps {
  children: React.ReactNode
  api: ApiClient
  initialValues?: Record<string, unknown>
}

/**
 * Provides per-screen state and action dispatch to all child components.
 * Wrap each screen's content with this.
 */
export function ScreenContextProvider({
  children,
  api,
  initialValues = {},
}: ScreenContextProviderProps) {
  const [values, setValues] = useState<Record<string, unknown>>(initialValues)
  const queryClient = useQueryClient()
  const router = useRouter()
  const { manifest, setTheme } = useAppContext()

  const setValue = useCallback((key: string, value: unknown) => {
    setValues((prev) => ({ ...prev, [key]: value }))
  }, [])

  const getValue = useCallback(
    (key: string) => valuesRef.current[key],
    // No deps — always reads latest via ref, no need to re-create the function
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [],
  )

  // Stable ref so dispatch always sees latest values without re-creating the function
  const valuesRef = useRef(values)
  valuesRef.current = values

  const contextValue = useMemo<ScreenContextValue>(() => {
    const ctx: ScreenContextValue = {
      values,
      getValue,
      setValue,
      dispatch: async (action: Action) => {
        await executeAction(action, {
          screenContext: ctx,
          api,
          queryClient,
          resources: manifest.resources,
          workflows: manifest.workflows,
          setTheme,
          router: {
            push: (path, params) => router.push({ pathname: path as never, params }),
            replace: (path) => router.replace(path as never),
          },
        })
      },
    }
    return ctx
  }, [values, setValue, api, manifest.resources, manifest.workflows, queryClient, router, setTheme]) // getValue removed - it's stable

  return <ScreenContext.Provider value={contextValue}>{children}</ScreenContext.Provider>
}

/**
 * Access the per-screen context. Throws if used outside ScreenContextProvider.
 */
export function useScreenContext(): ScreenContextValue {
  const ctx = useContext(ScreenContext)
  if (!ctx)
    throw new Error('[pocketshot] useScreenContext must be used inside ScreenContextProvider')
  return ctx
}

/**
 * Access a single value from screen state by key.
 * Returns `undefined` if the key has not been set.
 */
export function useScreenValue<T>(key: string): T | undefined {
  const ctx = useScreenContext()
  return ctx.getValue(key) as T | undefined
}
