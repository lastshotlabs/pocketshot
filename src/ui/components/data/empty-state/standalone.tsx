import React from 'react'
import { Text, TouchableOpacity, View, type TextStyle, type ViewStyle } from 'react-native'
import { resolveNativeTextStyle } from '../../_base/text-style'
import { resolveSurfacePresentation } from '../../_base/style-surfaces'
import { useTokens } from '../../../context/AppContext'

export interface EmptyStateBaseProps {
  /** Heading text. */
  title: string
  /** Optional descriptive body. */
  description?: string
  /** Glyph/icon to display above the title. */
  icon?: string
  /** Action button. */
  action?: { label: string; onPress: () => void }
  /** Slot overrides (root, icon, title, description, action). */
  slots?: Record<string, Record<string, unknown>>
  style?: ViewStyle
  testID?: string
  id?: string
}

/**
 * Standalone EmptyState — plain React props, no manifest required.
 *
 * @example
 * <EmptyStateBase title="No results" description="Try a different search." icon="🔍" />
 */
export function EmptyStateBase({
  title,
  description,
  icon,
  action,
  slots,
  style,
  testID,
}: EmptyStateBaseProps) {
  const tokens = useTokens()
  const sharedTextStyle = resolveNativeTextStyle({}, tokens)

  const rootSurface = resolveSurfacePresentation({ tokens, componentSurface: slots?.root })
  const iconSurface = resolveSurfacePresentation({ tokens, componentSurface: slots?.icon })
  const titleSurface = resolveSurfacePresentation({ tokens, componentSurface: slots?.title })
  const descriptionSurface = resolveSurfacePresentation({
    tokens,
    componentSurface: slots?.description,
  })
  const actionSurface = resolveSurfacePresentation({ tokens, componentSurface: slots?.action })

  const containerStyle: ViewStyle = {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: tokens.spacing[8],
    ...style,
  }
  const iconStyle: TextStyle = {
    ...sharedTextStyle,
    fontSize: tokens.typography.fontSize5xl,
    marginBottom: tokens.spacing[4],
    textAlign: 'center',
  }
  const titleStyle: TextStyle = {
    ...sharedTextStyle,
    fontSize: tokens.typography.fontSizeLg,
    color: tokens.colors.text,
    fontWeight: tokens.typography.fontWeightSemibold,
    textAlign: 'center',
    marginBottom: tokens.spacing[2],
  }
  const descriptionStyle: TextStyle = {
    ...sharedTextStyle,
    fontSize: tokens.typography.fontSizeMd,
    color: tokens.colors.textMuted,
    textAlign: 'center',
    lineHeight: tokens.typography.fontSizeMd * tokens.typography.lineHeightNormal,
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
    ...sharedTextStyle,
    fontSize: tokens.typography.fontSizeMd,
    color: tokens.colors.primaryForeground,
    fontWeight: tokens.typography.fontWeightSemibold,
    textAlign: 'center',
  }

  return (
    <View
      style={[containerStyle, rootSurface.style as ViewStyle | undefined]}
      accessibilityRole="none"
      testID={testID}
    >
      {icon ? (
        <Text
          style={[iconStyle, iconSurface.style as TextStyle | undefined]}
          accessibilityElementsHidden
          importantForAccessibility="no"
        >
          {icon}
        </Text>
      ) : null}
      <Text
        style={[titleStyle, titleSurface.style as TextStyle | undefined]}
        accessibilityRole="header"
      >
        {title}
      </Text>
      {description ? (
        <Text style={[descriptionStyle, descriptionSurface.style as TextStyle | undefined]}>
          {description}
        </Text>
      ) : null}
      {action ? (
        <TouchableOpacity
          style={[actionButtonStyle, actionSurface.style as ViewStyle | undefined]}
          onPress={action.onPress}
          activeOpacity={0.75}
          accessibilityRole="button"
          accessibilityLabel={action.label}
        >
          <Text style={actionLabelStyle}>{action.label}</Text>
        </TouchableOpacity>
      ) : null}
    </View>
  )
}
