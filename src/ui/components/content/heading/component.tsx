import React from 'react'
import { Text, type TextStyle } from 'react-native'
import { ComponentWrapper } from '../../_base/ComponentWrapper'
import { resolveNativeTextStyle, resolveSurfacePresentation } from '../../_base'
import { useTokens } from '../../../context/AppContext'
import { useScreenContext } from '../../../context/ScreenContext'
import { resolveFromRef } from '../../_base/fromRef'
import type { HeadingConfig } from './types'

const LEVEL_SURFACES = {
  1: { fontSize: '4xl', fontWeight: 'bold' },
  2: { fontSize: '3xl', fontWeight: 'bold' },
  3: { fontSize: '2xl', fontWeight: 'semibold' },
  4: { fontSize: 'xl', fontWeight: 'semibold' },
  5: { fontSize: 'lg', fontWeight: 'medium' },
  6: { fontSize: 'base', fontWeight: 'medium' },
} as const

export function Heading({ config }: { config: HeadingConfig }) {
  const tokens = useTokens()
  const { values } = useScreenContext()

  const text = resolveFromRef(config.text, values) as string
  const level = config.level ?? 2
  const sharedTextStyle = resolveNativeTextStyle(config as Record<string, unknown>, tokens)
  const textSurface = resolveSurfacePresentation({
    tokens,
    implementationBase: {
      ...LEVEL_SURFACES[level],
      color: 'foreground',
      textAlign: 'left',
      lineHeight: 'tight',
    },
    componentSurface: config.slots?.text as Record<string, unknown> | undefined,
  })

  const style: TextStyle = {
    ...sharedTextStyle,
    ...(textSurface.style as TextStyle | undefined),
  }

  return (
    <ComponentWrapper id={config.id} testID={config.testID} config={config}>
      <Text style={style} accessibilityRole="header" testID={config.testID ?? config.id}>
        {text}
      </Text>
    </ComponentWrapper>
  )
}
