import React from 'react'
import { ScrollView, View, type ViewStyle } from 'react-native'
import { resolveSurfacePresentation } from '../../_base/style-surfaces'
import { useTokens } from '../../../context/AppContext'

type Edge = 'top' | 'bottom' | 'left' | 'right'

function useSafeAreaEdges(edges: Edge[]): {
  top: number
  bottom: number
  left: number
  right: number
} {
  try {
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const { useSafeAreaInsets } =
      require('react-native-safe-area-context') as typeof import('react-native-safe-area-context')
    // eslint-disable-next-line react-hooks/rules-of-hooks
    const insets = useSafeAreaInsets()
    return {
      top: edges.includes('top') ? insets.top : 0,
      bottom: edges.includes('bottom') ? insets.bottom : 0,
      left: edges.includes('left') ? insets.left : 0,
      right: edges.includes('right') ? insets.right : 0,
    }
  } catch {
    return {
      top: edges.includes('top') ? 44 : 0,
      bottom: edges.includes('bottom') ? 34 : 0,
      left: 0,
      right: 0,
    }
  }
}

export interface ScreenBaseProps {
  /** Whether content is wrapped in a ScrollView. */
  scrollable?: boolean
  /** Inner padding (token name or numeric pixels). */
  padding?: string | number
  /** Safe-area edges to respect. */
  edges?: Edge[]
  /** Style applied to the root viewport. */
  style?: ViewStyle
  /** Style applied to the inner content container. */
  contentContainerStyle?: ViewStyle
  /** Slot overrides (root, viewport, content). */
  slots?: Record<string, Record<string, unknown>>
  testID?: string
  id?: string
  children?: React.ReactNode
}

/**
 * Standalone Screen — plain React props, no manifest required.
 *
 * @example
 * <ScreenBase scrollable padding="lg">
 *   <Text>Hello</Text>
 * </ScreenBase>
 */
export function ScreenBase({
  scrollable = true,
  padding = 'lg',
  edges = ['top', 'bottom', 'left', 'right'],
  style,
  contentContainerStyle,
  slots,
  testID,
  id,
  children,
}: ScreenBaseProps) {
  const tokens = useTokens()
  const insets = useSafeAreaEdges(edges)

  const viewportSurface = resolveSurfacePresentation({
    tokens,
    implementationBase: {
      flex: 1,
      bg: 'background',
      paddingTop: insets.top,
      paddingBottom: insets.bottom,
      paddingLeft: insets.left,
      paddingRight: insets.right,
    },
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

  const rootTestID = testID ?? id ?? 'screen'

  if (scrollable) {
    return (
      <ScrollView
        style={[viewportSurface.style as ViewStyle | undefined, style]}
        contentContainerStyle={[
          contentSurface.style as ViewStyle | undefined,
          contentContainerStyle,
        ]}
        keyboardShouldPersistTaps="handled"
        testID={`${rootTestID}-scroll`}
      >
        {children}
      </ScrollView>
    )
  }

  return (
    <View style={[viewportSurface.style as ViewStyle | undefined, style]} testID={rootTestID}>
      <View
        style={[contentSurface.style as ViewStyle | undefined, contentContainerStyle]}
      >
        {children}
      </View>
    </View>
  )
}
