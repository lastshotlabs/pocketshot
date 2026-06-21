import React from 'react'
import { KeyboardAvoidingView, Platform, ScrollView, View, type ViewStyle } from 'react-native'
import { resolveSurfacePresentation } from '../../_base/style-surfaces'
import { useTokens } from '../../../context/AppContext'

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

export interface KeyboardAvoidingScreenBaseProps {
  /** Wrap content in a ScrollView (default true). */
  scrollable?: boolean
  /** Inner padding (token name or numeric pixels). */
  padding?: string | number
  /** KeyboardAvoidingView behavior override. */
  behavior?: 'padding' | 'height' | 'position'
  /** Style applied to the KeyboardAvoidingView root. */
  style?: ViewStyle
  /** Style applied to the inner content container. */
  contentContainerStyle?: ViewStyle
  /** Slot overrides (root, keyboardAvoiding, viewport, content). */
  slots?: Record<string, Record<string, unknown>>
  testID?: string
  id?: string
  children?: React.ReactNode
}

/**
 * Standalone KeyboardAvoidingScreen — plain React props, no manifest required.
 *
 * @example
 * <KeyboardAvoidingScreenBase scrollable>
 *   <Text>Form</Text>
 * </KeyboardAvoidingScreenBase>
 */
export function KeyboardAvoidingScreenBase({
  scrollable = true,
  padding = 'lg',
  behavior,
  style,
  contentContainerStyle,
  slots,
  testID,
  id,
  children,
}: KeyboardAvoidingScreenBaseProps) {
  const tokens = useTokens()
  const insets = useSafeAreaInsets()
  const resolvedBehavior = behavior ?? DEFAULT_BEHAVIOR
  const idPrefix = testID ?? id ?? 'kb-screen'

  const keyboardAvoidingSurface = resolveSurfacePresentation({
    tokens,
    implementationBase: {
      flex: 1,
      bg: 'background',
      paddingTop: insets.top,
      paddingBottom: insets.bottom,
    },
    componentSurface: slots?.keyboardAvoiding,
  })
  const viewportSurface = resolveSurfacePresentation({
    tokens,
    implementationBase: { flex: 1 },
    componentSurface: slots?.viewport,
  })
  const contentSurface = resolveSurfacePresentation({
    tokens,
    implementationBase: {
      flex: 1,
      flexGrow: 1,
      padding,
    },
    componentSurface: slots?.content,
  })

  return (
    <KeyboardAvoidingView
      style={[keyboardAvoidingSurface.style as ViewStyle | undefined, style]}
      behavior={resolvedBehavior}
      testID={`${idPrefix}-keyboard-avoiding`}
    >
      {scrollable ? (
        <ScrollView
          style={viewportSurface.style as ViewStyle | undefined}
          contentContainerStyle={[
            contentSurface.style as ViewStyle | undefined,
            contentContainerStyle,
          ]}
          keyboardShouldPersistTaps="handled"
          testID={`${idPrefix}-scroll`}
        >
          {children}
        </ScrollView>
      ) : (
        <View style={viewportSurface.style as ViewStyle | undefined}>
          <View
            style={[contentSurface.style as ViewStyle | undefined, contentContainerStyle]}
          >
            {children}
          </View>
        </View>
      )}
    </KeyboardAvoidingView>
  )
}
