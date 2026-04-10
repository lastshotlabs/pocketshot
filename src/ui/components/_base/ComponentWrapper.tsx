import React, { type ReactNode, Component } from 'react'
import { View, Text, type ViewStyle } from 'react-native'

// ── Error Boundary ─────────────────────────────────────────────────────────────

interface ErrorBoundaryProps {
  children: ReactNode
  id?: string
  testID?: string
}

interface ErrorBoundaryState {
  hasError: boolean
  error?: Error
}

class ComponentErrorBoundary extends Component<ErrorBoundaryProps, ErrorBoundaryState> {
  state: { hasError: boolean; error?: Error } = { hasError: false }

  static getDerivedStateFromError(error: Error) {
    return { hasError: true, error }
  }

  componentDidCatch(error: Error, info: React.ErrorInfo) {
    this.setState({ error })
    console.error(`[pocketshot] Component "${this.props.id}" threw:`, error, info)
  }

  render() {
    if (this.state.hasError) {
      return (
        <View
          style={{
            padding: 12,
            backgroundColor: '#fee2e2',
            borderRadius: 8,
            borderWidth: 1,
            borderColor: '#fca5a5',
          }}
          testID={this.props.testID ? `${this.props.testID}-error` : undefined}
          accessibilityRole="alert"
          accessibilityLabel="Component error"
        >
          <Text style={{ fontSize: 12, color: '#dc2626', fontWeight: '600' }}>
            Component failed to render
          </Text>
          {__DEV__ && this.state.error ? (
            <Text style={{ fontSize: 11, color: '#dc2626', marginTop: 4 }} numberOfLines={3}>
              {this.state.error.message}
            </Text>
          ) : null}
        </View>
      )
    }
    return this.props.children
  }
}

// ── ComponentWrapper ───────────────────────────────────────────────────────────

export interface ComponentWrapperProps {
  /** Component ID for from-ref resolution and testID generation. */
  id?: string
  /** Override testID. Defaults to id if provided. */
  testID?: string
  /** Pass `{ flex: 1 }` for components that fill their parent (chat, lists, etc.). */
  style?: ViewStyle
  children: ReactNode
}

/**
 * Wraps every config-driven component. Provides:
 * - Error boundary (renders visible error fallback in dev, logs to console)
 * - testID for E2E testing
 *
 * Place this as the outermost element of every config-addressable component.
 */
export function ComponentWrapper({ id, testID, style, children }: ComponentWrapperProps) {
  return (
    <ComponentErrorBoundary id={id} testID={testID ?? id}>
      <View testID={testID ?? id} style={style}>
        {children}
      </View>
    </ComponentErrorBoundary>
  )
}
