import React, { useCallback } from 'react'
import { Text, TouchableOpacity, View, type TextStyle, type ViewStyle } from 'react-native'
import { ComponentWrapper } from '../../_base/ComponentWrapper'
import { resolveNativeTextStyle, resolveSurfacePresentation } from '../../_base'
import { useTokens } from '../../../context/AppContext'
import { useScreenContext } from '../../../context/ScreenContext'
import type { EmptyStateConfig } from './types'

export function EmptyState({ config }: { config: EmptyStateConfig }) {
  const tokens = useTokens()
  const { dispatch } = useScreenContext()
  const sharedTextStyle = resolveNativeTextStyle(config as Record<string, unknown>, tokens)

  const rootSurface = resolveSurfacePresentation({
    tokens,
    componentSurface: config.slots?.root as Record<string, unknown> | undefined,
  })
  const iconSurface = resolveSurfacePresentation({
    tokens,
    componentSurface: config.slots?.icon as Record<string, unknown> | undefined,
  })
  const titleSurface = resolveSurfacePresentation({
    tokens,
    componentSurface: config.slots?.title as Record<string, unknown> | undefined,
  })
  const descriptionSurface = resolveSurfacePresentation({
    tokens,
    componentSurface: config.slots?.description as Record<string, unknown> | undefined,
  })
  const actionSurface = resolveSurfacePresentation({
    tokens,
    componentSurface: config.slots?.action as Record<string, unknown> | undefined,
  })

  const handleActionPress = useCallback(async () => {
    if (!config.action?.onPress) return
    await dispatch(config.action.onPress)
  }, [config.action, dispatch])

  const containerStyle: ViewStyle = {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: tokens.spacing[8],
  }
  const iconStyle: TextStyle = {
    fontSize: tokens.typography.fontSize5xl,
    marginBottom: tokens.spacing[4],
    textAlign:
      typeof sharedTextStyle.textAlign === 'string' ? sharedTextStyle.textAlign : 'center',
  }
  const titleStyle: TextStyle = {
    fontSize:
      typeof sharedTextStyle.fontSize === 'number'
        ? sharedTextStyle.fontSize
        : tokens.typography.fontSizeLg,
    color: typeof sharedTextStyle.color === 'string' ? sharedTextStyle.color : tokens.colors.text,
    fontWeight:
      typeof sharedTextStyle.fontWeight === 'string'
        ? sharedTextStyle.fontWeight
        : tokens.typography.fontWeightSemibold,
    textAlign:
      typeof sharedTextStyle.textAlign === 'string' ? sharedTextStyle.textAlign : 'center',
    marginBottom: tokens.spacing[2],
    lineHeight:
      typeof sharedTextStyle.lineHeight === 'number' ? sharedTextStyle.lineHeight : undefined,
    letterSpacing:
      typeof sharedTextStyle.letterSpacing === 'number'
        ? sharedTextStyle.letterSpacing
        : undefined,
  }
  const descriptionStyle: TextStyle = {
    fontSize:
      typeof sharedTextStyle.fontSize === 'number'
        ? sharedTextStyle.fontSize
        : tokens.typography.fontSizeMd,
    color:
      typeof sharedTextStyle.color === 'string'
        ? sharedTextStyle.color
        : tokens.colors.textMuted,
    fontWeight:
      typeof sharedTextStyle.fontWeight === 'string' ? sharedTextStyle.fontWeight : undefined,
    textAlign:
      typeof sharedTextStyle.textAlign === 'string' ? sharedTextStyle.textAlign : 'center',
    lineHeight:
      typeof sharedTextStyle.lineHeight === 'number'
        ? sharedTextStyle.lineHeight
        : tokens.typography.fontSizeMd * tokens.typography.lineHeightNormal,
    letterSpacing:
      typeof sharedTextStyle.letterSpacing === 'number'
        ? sharedTextStyle.letterSpacing
        : undefined,
    marginBottom: tokens.spacing[6],
  }
  const actionButtonStyle: ViewStyle = {
    backgroundColor: tokens.colors.primary,
    borderRadius: tokens.radius.lg,
    paddingHorizontal: tokens.spacing[6],
    paddingVertical: tokens.spacing[3],
    marginTop: tokens.spacing[4],
  }
  const actionLabelStyle: TextStyle = {
    fontSize:
      typeof sharedTextStyle.fontSize === 'number'
        ? sharedTextStyle.fontSize
        : tokens.typography.fontSizeMd,
    color:
      typeof sharedTextStyle.color === 'string'
        ? sharedTextStyle.color
        : tokens.colors.primaryForeground,
    fontWeight:
      typeof sharedTextStyle.fontWeight === 'string'
        ? sharedTextStyle.fontWeight
        : tokens.typography.fontWeightSemibold,
    textAlign:
      typeof sharedTextStyle.textAlign === 'string' ? sharedTextStyle.textAlign : 'center',
    lineHeight:
      typeof sharedTextStyle.lineHeight === 'number' ? sharedTextStyle.lineHeight : undefined,
    letterSpacing:
      typeof sharedTextStyle.letterSpacing === 'number'
        ? sharedTextStyle.letterSpacing
        : undefined,
  }

  return (
    <ComponentWrapper id={config.id} testID={config.testID} config={config}>
      <View
        style={[containerStyle, rootSurface.style as ViewStyle | undefined]}
        accessibilityRole="none"
      >
        {config.icon ? (
          <Text
            style={[iconStyle, iconSurface.style as TextStyle | undefined]}
            accessibilityElementsHidden
            importantForAccessibility="no"
          >
            {config.icon}
          </Text>
        ) : null}
        <Text
          style={[titleStyle, titleSurface.style as TextStyle | undefined]}
          accessibilityRole="header"
        >
          {config.title}
        </Text>
        {config.description ? (
          <Text style={[descriptionStyle, descriptionSurface.style as TextStyle | undefined]}>
            {config.description}
          </Text>
        ) : null}
        {config.action ? (
          <TouchableOpacity
            style={[actionButtonStyle, actionSurface.style as ViewStyle | undefined]}
            onPress={handleActionPress}
            activeOpacity={0.75}
            accessibilityRole="button"
            accessibilityLabel={config.action.label}
          >
            <Text style={actionLabelStyle}>{config.action.label}</Text>
          </TouchableOpacity>
        ) : null}
      </View>
    </ComponentWrapper>
  )
}
