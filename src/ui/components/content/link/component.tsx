import React from 'react'
import { Text, TouchableOpacity, type TextStyle, type ViewStyle } from 'react-native'
import { ComponentWrapper } from '../../_base/ComponentWrapper'
import { resolveNativeTextStyle, resolveSurfacePresentation } from '../../_base'
import { useTokens } from '../../../context/AppContext'
import { useScreenContext } from '../../../context/ScreenContext'
import { resolveFromRef } from '../../_base/fromRef'
import type { LinkConfig } from './types'

const SIZE_MAP = {
  sm: 'sm',
  md: 'base',
  lg: 'lg',
} as const

export function Link({ config }: { config: LinkConfig }) {
  const tokens = useTokens()
  const { values, dispatch } = useScreenContext()

  const text = resolveFromRef(config.text, values) as string
  const sharedTextStyle = resolveNativeTextStyle(config as Record<string, unknown>, tokens)
  const buttonSurface = resolveSurfacePresentation({
    tokens,
    implementationBase: {},
    componentSurface: config.slots?.button as Record<string, unknown> | undefined,
  })
  const textSurface = resolveSurfacePresentation({
    tokens,
    implementationBase: {
      fontSize: SIZE_MAP[config.size ?? 'md'],
      fontWeight: 'medium',
      color: 'primary',
      textAlign: 'left',
    },
    componentSurface: config.slots?.text as Record<string, unknown> | undefined,
  })

  const style: TextStyle = {
    ...sharedTextStyle,
    textDecorationLine: config.underline ? 'underline' : 'none',
    ...(textSurface.style as TextStyle | undefined),
  }

  return (
    <ComponentWrapper id={config.id} testID={config.testID} config={config}>
      <TouchableOpacity
        onPress={() => void dispatch(config.action)}
        style={buttonSurface.style as ViewStyle | undefined}
        accessibilityRole="link"
        accessibilityLabel={text}
        activeOpacity={0.7}
        testID={config.testID ?? config.id}
      >
        <Text style={style}>{text}</Text>
      </TouchableOpacity>
    </ComponentWrapper>
  )
}
