import React from 'react'
import { View, type ViewStyle } from 'react-native'
import { ComponentWrapper } from '../../_base/ComponentWrapper'
import { resolveNativeTextStyle, resolveSurfacePresentation } from '../../_base'
import { useTokens } from '../../../context/AppContext'
import type { DividerConfig } from './types'

export function Divider({ config }: { config: DividerConfig }) {
  const tokens = useTokens()
  const sharedTextStyle = resolveNativeTextStyle(config as Record<string, unknown>, tokens)
  const isVertical = config.orientation === 'vertical'
  const dividerColor =
    typeof sharedTextStyle.color === 'string' ? sharedTextStyle.color : 'border'

  const lineSurface = resolveSurfacePresentation({
    tokens,
    implementationBase: {
      bg: dividerColor,
      ...(isVertical
        ? {
            width: config.thickness ?? 1,
            alignSelf: 'stretch',
          }
        : {
            height: config.thickness ?? 1,
            alignSelf: 'stretch',
          }),
    },
    componentSurface: config.slots?.line as Record<string, unknown> | undefined,
  })

  return (
    <ComponentWrapper id={config.id} testID={config.testID} config={config}>
      <View style={lineSurface.style as ViewStyle | undefined} accessibilityRole="none" />
    </ComponentWrapper>
  )
}
