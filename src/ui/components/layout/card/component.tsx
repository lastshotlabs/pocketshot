import React, { useCallback } from 'react'
import { Text, TouchableOpacity, View, type TextStyle, type ViewStyle } from 'react-native'
import { ComponentWrapper } from '../../_base/ComponentWrapper'
import { resolveNativeTextStyle, resolveSurfacePresentation } from '../../_base'
import { useTokens } from '../../../context/AppContext'
import { useScreenContext } from '../../../context/ScreenContext'
import { resolveFromRef, isFromRef } from '../../_base/fromRef'
import type { CardConfig } from './types'

export function Card({ config, children }: { config: CardConfig; children?: React.ReactNode }) {
  const tokens = useTokens()
  const { dispatch, values } = useScreenContext()
  const sharedTextStyle = resolveNativeTextStyle(config as Record<string, unknown>, tokens)
  const contentGap =
    config.gap !== undefined
      ? (tokens.spacing[config.gap as keyof typeof tokens.spacing] ?? config.gap)
      : undefined
  const resolvedTitle =
    config.title == null
      ? undefined
      : isFromRef(config.title)
        ? String(resolveFromRef(config.title, values) ?? '')
        : config.title
  const resolvedSubtitle =
    config.subtitle == null
      ? undefined
      : isFromRef(config.subtitle)
        ? String(resolveFromRef(config.subtitle, values) ?? '')
        : config.subtitle

  const headerSurface = resolveSurfacePresentation({
    tokens,
    implementationBase: {
      marginBottom: children != null ? tokens.spacing[3] : 0,
    },
    componentSurface: config.slots?.header as Record<string, unknown> | undefined,
  })
  const titleSurface = resolveSurfacePresentation({
    tokens,
    componentSurface: config.slots?.title as Record<string, unknown> | undefined,
  })
  const subtitleSurface = resolveSurfacePresentation({
    tokens,
    componentSurface: config.slots?.subtitle as Record<string, unknown> | undefined,
  })
  const contentSurface = resolveSurfacePresentation({
    tokens,
    implementationBase: {
      width: '100%',
      ...(contentGap !== undefined ? { gap: contentGap } : {}),
    },
    componentSurface: config.slots?.content as Record<string, unknown> | undefined,
  })
  const itemSurface = resolveSurfacePresentation({
    tokens,
    componentSurface: config.slots?.item as Record<string, unknown> | undefined,
  })
  const items = React.Children.toArray(children)

  const titleStyle: TextStyle = {
    fontSize:
      typeof sharedTextStyle.fontSize === 'number'
        ? sharedTextStyle.fontSize
        : tokens.typography.fontSizeLg,
    color:
      typeof sharedTextStyle.color === 'string' ? sharedTextStyle.color : tokens.colors.text,
    fontWeight:
      typeof sharedTextStyle.fontWeight === 'string'
        ? sharedTextStyle.fontWeight
        : tokens.typography.fontWeightSemibold,
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
  const subtitleStyle: TextStyle = {
    fontSize:
      typeof sharedTextStyle.fontSize === 'number'
        ? Math.max(sharedTextStyle.fontSize - 2, tokens.typography.fontSizeSm)
        : tokens.typography.fontSizeSm,
    color:
      typeof sharedTextStyle.color === 'string'
        ? sharedTextStyle.color
        : tokens.colors.textMuted,
    fontWeight:
      typeof sharedTextStyle.fontWeight === 'string'
        ? sharedTextStyle.fontWeight
        : tokens.typography.fontWeightRegular,
    lineHeight:
      typeof sharedTextStyle.lineHeight === 'number' ? sharedTextStyle.lineHeight : undefined,
    letterSpacing:
      typeof sharedTextStyle.letterSpacing === 'number'
        ? sharedTextStyle.letterSpacing
        : undefined,
    textAlign:
      typeof sharedTextStyle.textAlign === 'string' ? sharedTextStyle.textAlign : undefined,
    opacity: typeof sharedTextStyle.opacity === 'number' ? sharedTextStyle.opacity : undefined,
    marginTop: tokens.spacing[1],
  }

  const body = (
    <>
      {resolvedTitle || resolvedSubtitle ? (
        <View style={headerSurface.style as ViewStyle | undefined}>
          {resolvedTitle ? (
            <Text style={[titleStyle, titleSurface.style as TextStyle | undefined]}>{resolvedTitle}</Text>
          ) : null}
          {resolvedSubtitle ? (
            <Text style={[subtitleStyle, subtitleSurface.style as TextStyle | undefined]}>
              {resolvedSubtitle}
            </Text>
          ) : null}
        </View>
      ) : null}
      {items.length > 0 ? (
        <View style={contentSurface.style as ViewStyle | undefined}>
          {items.map((child, index) => (
            <View
              key={React.isValidElement(child) && child.key != null ? child.key : index}
              style={itemSurface.style as ViewStyle | undefined}
            >
              {child}
            </View>
          ))}
        </View>
      ) : null}
    </>
  )

  const handlePress = useCallback(async () => {
    if (!config.onPress) return
    await dispatch(config.onPress)
  }, [config.onPress, dispatch])

  return (
    <ComponentWrapper
      id={config.id}
      testID={config.testID}
      config={config}
      style={{
        backgroundColor: tokens.colors.surface,
        borderRadius: tokens.radius.lg,
        padding: tokens.spacing[4],
        ...tokens.shadows.md,
      }}
    >
      {config.onPress ? (
        <TouchableOpacity
          style={{ width: '100%' }}
          onPress={handlePress}
          accessibilityRole="button"
          accessibilityLabel={resolvedTitle || 'Card'}
          activeOpacity={0.7}
        >
          {body}
        </TouchableOpacity>
      ) : (
        body
      )}
    </ComponentWrapper>
  )
}
