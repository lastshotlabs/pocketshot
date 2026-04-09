import React, { type ReactNode, Component } from 'react'
import { View } from 'react-native'

// ── Error Boundary ─────────────────────────────────────────────────────────────

interface ErrorBoundaryState {
  hasError: boolean
  error: Error | null
}

class ComponentErrorBoundary extends Component<
  { children: ReactNode; componentId?: string },
  ErrorBoundaryState
> {
  state: ErrorBoundaryState = { hasError: false, error: null }

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return { hasError: true, error }
  }

  componentDidCatch(error: Error) {
    console.error(
      `[pocketshot] Component error${this.props.componentId ? ` in "${this.props.componentId}"` : ''}:`,
      error,
    )
  }

  render() {
    if (this.state.hasError) return null // Fail silently in production
    return this.props.children
  }
}

// ── ComponentWrapper ───────────────────────────────────────────────────────────

export interface ComponentWrapperProps {
  /** Component ID for from-ref resolution and testID generation. */
  id?: string
  /** Override testID. Defaults to id if provided. */
  testID?: string
  children: ReactNode
}

/**
 * Wraps every config-driven component. Provides:
 * - Error boundary (fails silently in production, logs to console)
 * - testID for E2E testing
 *
 * Place this as the outermost element of every config-addressable component.
 */
export function ComponentWrapper({ id, testID, children }: ComponentWrapperProps) {
  return (
    <ComponentErrorBoundary componentId={id}>
      <View testID={testID ?? id} style={{ flexShrink: 1 }}>
        {children}
      </View>
    </ComponentErrorBoundary>
  )
}
