import React from 'react'
import { KeyboardAvoidingView, Platform, ScrollView, View, type ViewStyle } from 'react-native'
import { ComponentWrapper } from '../../_base/ComponentWrapper'
import { resolveSurfacePresentation } from '../../_base'
import { useTokens } from '../../../context/AppContext'
import type { KeyboardAvoidingScreenConfig } from './types'

const DEFAULT_BEHAVIOR = Platform.OS === 'ios' ? 'padding' : 'height'

function useSafeAreaInsets(): { top: number; bottom: number } {
  try {
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const safeArea =
      require('react-native-safe-area-context') as typeof import('react-native-safe-area-context')
    // eslint-disable-next-line react-hooks/rules-of-hooks
    const insets = safeArea.useSafeAreaInsets()
    return { top: insets.top, bottom: insets.bottom }
  } catch {
    return { top: 44, bottom: 34 }
  }
}

export function KeyboardAvoidingScreen({
  config,
  children,
}: {
  config: KeyboardAvoidingScreenConfig
  children?: React.ReactNode
}) {
  const tokens = useTokens()
  const scrollable = config.scrollable ?? true
  const behavior = config.behavior ?? DEFAULT_BEHAVIOR
  const insets = useSafeAreaInsets()
  const idPrefix = config.testID ?? config.id ?? 'kb-screen'

  const keyboardAvoidingSurface = resolveSurfacePresentation({
    tokens,
    implementationBase: {
      flex: 1,
      bg: 'background',
      paddingTop: insets.top,
      paddingBottom: insets.bottom,
    },
    componentSurface: config.slots?.keyboardAvoiding as Record<string, unknown> | undefined,
  })
  const viewportSurface = resolveSurfacePresentation({
    tokens,
    implementationBase: {
      flex: 1,
    },
    componentSurface: config.slots?.viewport as Record<string, unknown> | undefined,
  })
  const contentSurface = resolveSurfacePresentation({
    tokens,
    implementationBase: {
      flex: 1,
      flexGrow: 1,
      padding: config.padding ?? 'lg',
    },
    componentSurface: config.slots?.content as Record<string, unknown> | undefined,
  })

  return (
    <ComponentWrapper id={config.id} testID={config.testID} config={config} style={{ flex: 1 }}>
      <KeyboardAvoidingView
        style={keyboardAvoidingSurface.style as ViewStyle | undefined}
        behavior={behavior}
        testID={`${idPrefix}-keyboard-avoiding`}
      >
        {scrollable ? (
          <ScrollView
            style={viewportSurface.style as ViewStyle | undefined}
            contentContainerStyle={contentSurface.style as ViewStyle | undefined}
            keyboardShouldPersistTaps="handled"
            testID={`${idPrefix}-scroll`}
          >
            {children}
          </ScrollView>
        ) : (
          <View style={viewportSurface.style as ViewStyle | undefined}>
            <View style={contentSurface.style as ViewStyle | undefined}>{children}</View>
          </View>
        )}
      </KeyboardAvoidingView>
    </ComponentWrapper>
  )
}
