import React, { useCallback, useEffect, useRef } from 'react'
import { Animated, Text, TouchableOpacity, View, type TextStyle, type ViewStyle } from 'react-native'
import { ComponentWrapper } from '../../_base/ComponentWrapper'
import { resolveNativeTextStyle, resolveSurfacePresentation } from '../../_base'
import { useTokens } from '../../../context/AppContext'
import { useScreenContext } from '../../../context/ScreenContext'
import { resolveFromRef, isFromRef } from '../../_base/fromRef'
import type { DesignTokens } from '../../../tokens/types'
import type { DetailCardConfig } from './types'

function FieldSkeleton({ tokens }: { tokens: DesignTokens }) {
  const opacity = useRef(new Animated.Value(0.4)).current

  useEffect(() => {
    const anim = Animated.loop(
      Animated.sequence([
        Animated.timing(opacity, { toValue: 1, duration: 700, useNativeDriver: true }),
        Animated.timing(opacity, { toValue: 0.4, duration: 700, useNativeDriver: true }),
      ]),
    )
    anim.start()
    return () => anim.stop()
  }, [opacity])

  return (
    <View
      style={{
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: tokens.spacing[4],
        paddingVertical: tokens.spacing[3],
        borderBottomWidth: 1,
        borderBottomColor: tokens.colors.divider,
      }}
      accessibilityElementsHidden
      importantForAccessibility="no-hide-descendants"
    >
      <Animated.View
        style={{
          width: 100,
          height: 12,
          borderRadius: tokens.radius.sm,
          backgroundColor: tokens.colors.surfaceAlt,
          opacity,
          marginRight: tokens.spacing[4],
        }}
      />
      <Animated.View
        style={{
          flex: 1,
          height: 12,
          borderRadius: tokens.radius.sm,
          backgroundColor: tokens.colors.surfaceAlt,
          opacity,
        }}
      />
    </View>
  )
}

function formatDate(value: string): string {
  try {
    return new Date(value).toLocaleDateString()
  } catch {
    return value
  }
}

function FieldValue({
  type,
  value,
  tokens,
  onDispatch,
  testID,
  textStyle,
}: {
  type: 'text' | 'badge' | 'link' | 'date' | 'email' | 'phone'
  value: string
  tokens: DesignTokens
  onDispatch: (url: string) => Promise<void>
  testID?: string
  textStyle: TextStyle
}) {
  if (type === 'badge') {
    return (
      <View
        style={{
          alignSelf: 'flex-start',
          backgroundColor: tokens.colors.badgeBackground,
          borderRadius: tokens.radius.full,
          paddingHorizontal: 8,
          paddingVertical: 2,
        }}
        accessibilityRole="text"
      >
        <Text
          style={{
            fontSize: textStyle.fontSize ?? tokens.typography.fontSizeSm,
            color: tokens.colors.badgeForeground,
            fontWeight:
              typeof textStyle.fontWeight === 'string'
                ? textStyle.fontWeight
                : tokens.typography.fontWeightMedium,
            letterSpacing:
              typeof textStyle.letterSpacing === 'number' ? textStyle.letterSpacing : undefined,
          }}
        >
          {value}
        </Text>
      </View>
    )
  }

  if (type === 'link') {
    return (
      <TouchableOpacity
        onPress={() => void onDispatch(value)}
        accessibilityRole="link"
        accessibilityLabel={value}
        testID={testID}
      >
        <Text style={[textStyle, { color: tokens.colors.primary, textDecorationLine: 'underline' }]}>
          {value}
        </Text>
      </TouchableOpacity>
    )
  }

  if (type === 'date') {
    return (
      <Text style={textStyle} accessibilityRole="text">
        {formatDate(value)}
      </Text>
    )
  }

  if (type === 'email') {
    return (
      <TouchableOpacity
        onPress={() => void onDispatch(`mailto:${value}`)}
        accessibilityRole="link"
        accessibilityLabel={`Email ${value}`}
        testID={testID}
      >
        <Text style={[textStyle, { color: tokens.colors.primary, textDecorationLine: 'underline' }]}>
          {value}
        </Text>
      </TouchableOpacity>
    )
  }

  if (type === 'phone') {
    return (
      <TouchableOpacity
        onPress={() => void onDispatch(`tel:${value}`)}
        accessibilityRole="link"
        accessibilityLabel={`Call ${value}`}
        testID={testID}
      >
        <Text style={[textStyle, { color: tokens.colors.primary, textDecorationLine: 'underline' }]}>
          {value}
        </Text>
      </TouchableOpacity>
    )
  }

  return (
    <Text style={textStyle} accessibilityRole="text">
      {value}
    </Text>
  )
}

export function DetailCard({ config }: { config: DetailCardConfig }) {
  const tokens = useTokens()
  const { dispatch, values } = useScreenContext()
  const sharedTextStyle = resolveNativeTextStyle(config as Record<string, unknown>, tokens)

  const isLoading: boolean = isFromRef(config.loading)
    ? Boolean(resolveFromRef(config.loading, values))
    : ((config.loading as boolean | undefined) ?? false)
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

  const handleOpenUrl = useCallback(
    async (url: string) => {
      await dispatch({ type: 'open-url', url })
    },
    [dispatch],
  )

  const handleEditPress = useCallback(async () => {
    if (!config.onEditPress) return
    await dispatch(config.onEditPress)
  }, [config.onEditPress, dispatch])

  const panelSurface = resolveSurfacePresentation({
    tokens,
    componentSurface: config.slots?.panel as Record<string, unknown> | undefined,
  })
  const headerSurface = resolveSurfacePresentation({
    tokens,
    componentSurface: config.slots?.header as Record<string, unknown> | undefined,
  })
  const titleSurface = resolveSurfacePresentation({
    tokens,
    componentSurface: config.slots?.title as Record<string, unknown> | undefined,
  })
  const actionsSurface = resolveSurfacePresentation({
    tokens,
    componentSurface: config.slots?.actions as Record<string, unknown> | undefined,
  })
  const actionButtonSurface = resolveSurfacePresentation({
    tokens,
    componentSurface: config.slots?.actionButton as Record<string, unknown> | undefined,
  })
  const fieldsSurface = resolveSurfacePresentation({
    tokens,
    componentSurface: config.slots?.fields as Record<string, unknown> | undefined,
  })
  const loadingSurface = resolveSurfacePresentation({
    tokens,
    componentSurface: config.slots?.loadingState as Record<string, unknown> | undefined,
  })

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
  const buttonTextStyle: TextStyle = {
    fontSize: tokens.typography.fontSizeSm,
    color: tokens.colors.text,
    fontWeight: tokens.typography.fontWeightMedium,
  }
  const fieldLabelStyle: TextStyle = {
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
        : tokens.typography.fontWeightMedium,
    lineHeight:
      typeof sharedTextStyle.lineHeight === 'number' ? sharedTextStyle.lineHeight : undefined,
    letterSpacing:
      typeof sharedTextStyle.letterSpacing === 'number'
        ? sharedTextStyle.letterSpacing
        : undefined,
  }
  const fieldValueTextStyle: TextStyle = {
    fontSize:
      typeof sharedTextStyle.fontSize === 'number'
        ? Math.max(sharedTextStyle.fontSize - 2, tokens.typography.fontSizeSm)
        : tokens.typography.fontSizeSm,
    color:
      typeof sharedTextStyle.color === 'string' ? sharedTextStyle.color : tokens.colors.text,
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
  }

  const skeletonCount = config.sections.reduce((acc, s) => acc + s.fields.length, 0)
  const panelStyle: ViewStyle = {
    backgroundColor: tokens.colors.surface,
    borderRadius: tokens.radius.lg,
    borderWidth: 1,
    borderColor: tokens.colors.border,
    overflow: 'hidden',
    ...tokens.shadows.sm,
  }
  const headerStyle: ViewStyle = {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    paddingHorizontal: tokens.spacing[4],
    paddingVertical: tokens.spacing[4],
    borderBottomWidth: 1,
    borderBottomColor: tokens.colors.divider,
  }
  const titleGroupStyle: ViewStyle = {
    flex: 1,
  }
  const actionsStyle: ViewStyle = {
    marginLeft: tokens.spacing[3],
  }
  const actionButtonStyle: ViewStyle = {
    paddingHorizontal: tokens.spacing[3],
    paddingVertical: tokens.spacing[1],
    borderRadius: tokens.radius.md,
    borderWidth: 1,
    borderColor: tokens.colors.border,
  }
  const fieldsWrapperStyle: ViewStyle = {}

  return (
    <ComponentWrapper id={config.id} testID={config.testID} config={config}>
      <View style={[panelStyle, panelSurface.style as ViewStyle | undefined]}>
        {(resolvedTitle || resolvedSubtitle || config.onEditPress) && (
          <View style={[headerStyle, headerSurface.style as ViewStyle | undefined]}>
            <View style={titleGroupStyle}>
              {resolvedTitle ? (
                <Text
                  style={[titleStyle, titleSurface.style as TextStyle | undefined]}
                  accessibilityRole="header"
                >
                  {resolvedTitle}
                </Text>
              ) : null}
              {resolvedSubtitle ? <Text style={subtitleStyle}>{resolvedSubtitle}</Text> : null}
            </View>
            {config.onEditPress ? (
              <View style={[actionsStyle, actionsSurface.style as ViewStyle | undefined]}>
                <TouchableOpacity
                  onPress={() => void handleEditPress()}
                  style={[actionButtonStyle, actionButtonSurface.style as ViewStyle | undefined]}
                  accessibilityRole="button"
                  accessibilityLabel="Edit"
                  testID={config.testID ? `${config.testID}-edit` : 'detail-card-edit'}
                >
                  <Text style={buttonTextStyle}>Edit</Text>
                </TouchableOpacity>
              </View>
            ) : null}
          </View>
        )}

        {isLoading ? (
          <View style={loadingSurface.style as ViewStyle | undefined}>
            {Array.from({ length: Math.max(skeletonCount, 3) }, (_, i) => (
              <FieldSkeleton key={i} tokens={tokens} />
            ))}
          </View>
        ) : (
          <View style={[fieldsWrapperStyle, fieldsSurface.style as ViewStyle | undefined]}>
            {config.sections.map((section, sectionIdx) => (
              <View key={sectionIdx}>
                {section.title ? (
                  <View
                    style={{
                      paddingHorizontal: tokens.spacing[4],
                      paddingVertical: tokens.spacing[2],
                      backgroundColor: tokens.colors.surfaceAlt,
                    }}
                  >
                    <Text
                      style={{
                        fontSize: tokens.typography.fontSizeSm,
                        fontWeight: tokens.typography.fontWeightSemibold,
                        color: tokens.colors.textMuted,
                        letterSpacing: 0.8,
                      }}
                    >
                      {section.title.toUpperCase()}
                    </Text>
                  </View>
                ) : null}
                {section.fields.map((field, fieldIdx) => {
                  const rawValue: string | undefined = isFromRef(field.value)
                    ? (() => {
                        const resolved = resolveFromRef(field.value, values)
                        return resolved == null ? undefined : String(resolved)
                      })()
                    : typeof field.value === 'string'
                      ? field.value
                      : undefined
                  const displayValue = rawValue != null ? String(rawValue) : ''
                  const isLast =
                    fieldIdx === section.fields.length - 1 &&
                    sectionIdx === config.sections.length - 1
                  const testID = config.testID
                    ? `${config.testID}-field-${field.label.toLowerCase().replace(/\s+/g, '-')}`
                    : `detail-card-field-${field.label.toLowerCase().replace(/\s+/g, '-')}`

                  const fieldSurface = resolveSurfacePresentation({
                    tokens,
                    componentSurface: config.slots?.field as Record<string, unknown> | undefined,
                    itemSurface: field.slots?.field as Record<string, unknown> | undefined,
                  })
                  const fieldLabelSurface = resolveSurfacePresentation({
                    tokens,
                    componentSurface: config.slots?.fieldLabel as Record<string, unknown> | undefined,
                    itemSurface: field.slots?.fieldLabel as Record<string, unknown> | undefined,
                  })
                  const fieldValueSurface = resolveSurfacePresentation({
                    tokens,
                    componentSurface: config.slots?.fieldValue as Record<string, unknown> | undefined,
                    itemSurface: field.slots?.fieldValue as Record<string, unknown> | undefined,
                  })

                  const fieldRowStyle: ViewStyle = {
                    flexDirection: 'row',
                    alignItems: 'center',
                    paddingHorizontal: tokens.spacing[4],
                    paddingVertical: tokens.spacing[3],
                    borderBottomWidth: isLast ? 0 : 1,
                    borderBottomColor: tokens.colors.divider,
                  }
                  const fieldLabelWrapperStyle: ViewStyle = {
                    width: 120,
                    flexShrink: 0,
                    marginRight: tokens.spacing[3],
                  }
                  const fieldValueWrapperStyle: ViewStyle = {
                    flex: 1,
                  }

                  return (
                    <View
                      key={fieldIdx}
                      style={[fieldRowStyle, fieldSurface.style as ViewStyle | undefined]}
                      accessibilityRole="text"
                      accessibilityLabel={`${field.label}: ${displayValue}`}
                    >
                      <View style={fieldLabelWrapperStyle}>
                        <Text
                          style={[fieldLabelStyle, fieldLabelSurface.style as TextStyle | undefined]}
                          numberOfLines={1}
                        >
                          {field.label}
                        </Text>
                      </View>
                      <View
                        style={[fieldValueWrapperStyle, fieldValueSurface.style as ViewStyle | undefined]}
                      >
                        <FieldValue
                          type={field.type ?? 'text'}
                          value={displayValue}
                          tokens={tokens}
                          onDispatch={handleOpenUrl}
                          testID={testID}
                          textStyle={fieldValueTextStyle}
                        />
                      </View>
                    </View>
                  )
                })}
              </View>
            ))}
          </View>
        )}
      </View>
    </ComponentWrapper>
  )
}
