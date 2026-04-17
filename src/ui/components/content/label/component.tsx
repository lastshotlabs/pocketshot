import React from 'react'
import { Text, type TextStyle } from 'react-native'
import { ComponentWrapper } from '../../_base/ComponentWrapper'
import { resolveNativeTextStyle, resolveSurfacePresentation } from '../../_base'
import { useTokens } from '../../../context/AppContext'
import { useScreenContext } from '../../../context/ScreenContext'
import { resolveFromRef } from '../../_base/fromRef'
import type { LabelConfig } from './types'

const SIZE_MAP = {
  xs: 'xs',
  sm: 'sm',
  md: 'base',
} as const

const VARIANT_COLOR = {
  default: 'foreground',
  muted: 'muted',
  error: 'error',
  success: 'success',
} as const

export function Label({ config }: { config: LabelConfig }) {
  const tokens = useTokens()
  const { values } = useScreenContext()

  const text = resolveFromRef(config.text, values) as string
  const sharedTextStyle = resolveNativeTextStyle(config as Record<string, unknown>, tokens)
  const textSurface = resolveSurfacePresentation({
    tokens,
    implementationBase: {
      fontSize: SIZE_MAP[config.size ?? 'sm'],
      fontWeight: 'medium',
      color: VARIANT_COLOR[config.variant ?? 'default'],
      textAlign: 'left',
      letterSpacing: config.uppercase ? 'wide' : undefined,
    },
    componentSurface: config.slots?.text as Record<string, unknown> | undefined,
  })

  const style: TextStyle = {
    ...sharedTextStyle,
    ...(textSurface.style as TextStyle | undefined),
  }

  return (
    <ComponentWrapper id={config.id} testID={config.testID} config={config}>
      <Text style={style} accessibilityRole="text" testID={config.testID ?? config.id}>
        {config.uppercase ? text.toUpperCase() : text}
      </Text>
    </ComponentWrapper>
  )
}
