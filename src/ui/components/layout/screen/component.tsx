import React from 'react'
import { ScrollView, View, type ViewStyle } from 'react-native'
import { ComponentWrapper } from '../../_base/ComponentWrapper'
import { resolveSurfacePresentation } from '../../_base'
import { useTokens } from '../../../context/AppContext'
import type { ScreenConfig } from './types'

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

export function Screen({
  config,
  children,
}: {
  config: ScreenConfig
  children?: React.ReactNode
}) {
  const tokens = useTokens()
  const edges = config.edges ?? ['top', 'bottom', 'left', 'right']
  const scrollable = config.scrollable ?? true
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
      {scrollable ? (
        <ScrollView
          style={viewportSurface.style as ViewStyle | undefined}
          contentContainerStyle={contentSurface.style as ViewStyle | undefined}
          keyboardShouldPersistTaps="handled"
          testID={config.testID ? `${config.testID}-scroll` : `${config.id ?? 'screen'}-scroll`}
        >
          {children}
        </ScrollView>
      ) : (
        <View style={viewportSurface.style as ViewStyle | undefined}>
          <View style={contentSurface.style as ViewStyle | undefined}>{children}</View>
        </View>
      )}
    </ComponentWrapper>
  )
}
