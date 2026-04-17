import React from 'react'
import { Text, TouchableOpacity, type TextStyle, type ViewStyle } from 'react-native'
import { ComponentWrapper } from '../../_base/ComponentWrapper'
import { resolveNativeTextStyle, resolveSurfacePresentation } from '../../_base'
import { useTokens } from '../../../context/AppContext'
import { useScreenContext } from '../../../context/ScreenContext'
import type { BackButtonConfig } from './types'

export function BackButton({ config }: { config: BackButtonConfig }) {
  const tokens = useTokens()
  const { dispatch } = useScreenContext()
  const sharedTextStyle = resolveNativeTextStyle(config as Record<string, unknown>, tokens)

  const baseTextStyle: TextStyle = {
    fontSize:
      typeof sharedTextStyle.fontSize === 'number'
        ? sharedTextStyle.fontSize
        : undefined,
    fontWeight:
      typeof sharedTextStyle.fontWeight === 'string' ? sharedTextStyle.fontWeight : undefined,
    lineHeight:
      typeof sharedTextStyle.lineHeight === 'number' ? sharedTextStyle.lineHeight : undefined,
    letterSpacing:
      typeof sharedTextStyle.letterSpacing === 'number'
        ? sharedTextStyle.letterSpacing
        : undefined,
    textAlign:
      typeof sharedTextStyle.textAlign === 'string' ? sharedTextStyle.textAlign : undefined,
    opacity: typeof sharedTextStyle.opacity === 'number' ? sharedTextStyle.opacity : undefined,
  }

  const buttonSurface = resolveSurfacePresentation({
    tokens,
    implementationBase: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 'xs',
      paddingY: 'xs',
      paddingX: 'xs',
      alignSelf: 'start',
    },
    componentSurface: config.slots?.button as Record<string, unknown> | undefined,
  })
  const iconSurface = resolveSurfacePresentation({
    tokens,
    implementationBase: {
      fontSize: 'lg',
      color: 'primary',
    },
    componentSurface: config.slots?.icon as Record<string, unknown> | undefined,
  })
  const labelSurface = resolveSurfacePresentation({
    tokens,
    implementationBase: {
      fontSize: 'base',
      fontWeight: 'medium',
      color: 'primary',
    },
    componentSurface: config.slots?.label as Record<string, unknown> | undefined,
  })

  function handlePress() {
    const action = config.action ?? { type: 'navigate' as const, to: '..' }
    void dispatch(action)
  }

  return (
    <ComponentWrapper id={config.id} testID={config.testID} config={config}>
      <TouchableOpacity
        onPress={handlePress}
        style={buttonSurface.style as ViewStyle | undefined}
        accessibilityLabel={config.label}
        accessibilityRole="button"
        accessibilityHint="Navigate to the previous screen"
        testID={config.testID ?? config.id ?? 'back-button'}
      >
        <Text
          style={{
            ...baseTextStyle,
            ...(iconSurface.style as TextStyle | undefined),
          }}
          accessibilityElementsHidden
        >
          {'<'}
        </Text>
        <Text
          style={{
            ...baseTextStyle,
            ...(labelSurface.style as TextStyle | undefined),
          }}
        >
          {config.label}
        </Text>
      </TouchableOpacity>
    </ComponentWrapper>
  )
}
