import React from 'react'
import { Text, type TextStyle } from 'react-native'
import { ComponentWrapper } from '../../_base/ComponentWrapper'
import { resolveNativeTextStyle, resolveSurfacePresentation } from '../../_base'
import { useTokens } from '../../../context/AppContext'
import { useScreenContext } from '../../../context/ScreenContext'
import { resolveFromRef } from '../../_base/fromRef'
import type { BodyConfig } from './types'

export function Body({ config }: { config: BodyConfig }) {
  const tokens = useTokens()
  const { values } = useScreenContext()

  const text = resolveFromRef(config.text, values) as string
  const sharedTextStyle = resolveNativeTextStyle(config as Record<string, unknown>, tokens)
  const textSurface = resolveSurfacePresentation({
    tokens,
    implementationBase: {
      fontSize: 'base',
      fontWeight: 'normal',
      color: 'foreground',
      textAlign: 'left',
      lineHeight: 'normal',
    },
    componentSurface: config.slots?.text as Record<string, unknown> | undefined,
  })

  const style: TextStyle = {
    ...sharedTextStyle,
    ...(textSurface.style as TextStyle | undefined),
  }

  return (
    <ComponentWrapper id={config.id} testID={config.testID} config={config}>
      <Text
        style={style}
        numberOfLines={config.numberOfLines}
        accessibilityRole="text"
        testID={config.testID ?? config.id}
      >
        {text}
      </Text>
    </ComponentWrapper>
  )
}
