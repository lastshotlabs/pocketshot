import React, { useCallback, useEffect, useMemo, useRef } from 'react'
import { View, Text, TouchableOpacity, StyleSheet, Animated, ScrollView } from 'react-native'
import { ComponentWrapper } from '../../_base/ComponentWrapper'
import { useTokens } from '../../../context/AppContext'
import { useScreenContext } from '../../../context/ScreenContext'
import { resolveFromRef, isFromRef } from '../../_base/fromRef'
import type { DesignTokens } from '../../../tokens/types'
import type { DetailCardConfig } from './types'

// ---------------------------------------------------------------------------
// Skeleton shimmer
// ---------------------------------------------------------------------------

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
        borderBottomWidth: StyleSheet.hairlineWidth,
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

// ---------------------------------------------------------------------------
// Field value renderer
// ---------------------------------------------------------------------------

interface FieldValueProps {
  type: 'text' | 'badge' | 'link' | 'date' | 'email' | 'phone'
  value: string
  tokens: DesignTokens
  onDispatch: (url: string) => Promise<void>
  testID?: string
}

function FieldValue({ type, value, tokens, onDispatch, testID }: FieldValueProps) {
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
            fontSize: tokens.typography.fontSizeSm,
            color: tokens.colors.badgeForeground,
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
        onPress={() => onDispatch(value)}
        accessibilityRole="link"
        accessibilityLabel={value}
        testID={testID}
      >
        <Text
          style={{
            fontSize: tokens.typography.fontSizeSm,
            color: tokens.colors.primary,
            textDecorationLine: 'underline',
          }}
        >
          {value}
        </Text>
      </TouchableOpacity>
    )
  }

  if (type === 'date') {
    const formatted = (() => {
      try {
        return new Date(value).toLocaleDateString()
      } catch {
        return value
      }
    })()
    return (
      <Text
        style={{ fontSize: tokens.typography.fontSizeSm, color: tokens.colors.text }}
        accessibilityRole="text"
      >
        {formatted}
      </Text>
    )
  }

  if (type === 'email') {
    return (
      <TouchableOpacity
        onPress={() => onDispatch(`mailto:${value}`)}
        accessibilityRole="link"
        accessibilityLabel={`Email ${value}`}
        testID={testID}
      >
        <Text
          style={{
            fontSize: tokens.typography.fontSizeSm,
            color: tokens.colors.primary,
            textDecorationLine: 'underline',
          }}
        >
          {value}
        </Text>
      </TouchableOpacity>
    )
  }

  if (type === 'phone') {
    return (
      <TouchableOpacity
        onPress={() => onDispatch(`tel:${value}`)}
        accessibilityRole="link"
        accessibilityLabel={`Call ${value}`}
        testID={testID}
      >
        <Text
          style={{
            fontSize: tokens.typography.fontSizeSm,
            color: tokens.colors.primary,
            textDecorationLine: 'underline',
          }}
        >
          {value}
        </Text>
      </TouchableOpacity>
    )
  }

  // text (default)
  return (
    <Text
      style={{ fontSize: tokens.typography.fontSizeSm, color: tokens.colors.text }}
      accessibilityRole="text"
    >
      {value}
    </Text>
  )
}

// ---------------------------------------------------------------------------
// DetailCard
// ---------------------------------------------------------------------------

export function DetailCard({ config }: { config: DetailCardConfig }) {
  const tokens = useTokens()
  const { dispatch, values } = useScreenContext()
  const styles = useMemo(() => makeStyles(tokens), [tokens])

  const isLoading: boolean = isFromRef(config.loading)
    ? resolveFromRef<boolean>(config.loading as unknown as boolean, values)
    : ((config.loading as boolean | undefined) ?? false)

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

  const skeletonCount = config.sections.reduce((acc, s) => acc + s.fields.length, 0)

  return (
    <ComponentWrapper id={config.id} testID={config.testID} config={config}>
      <View style={styles.card}>
        {/* Header */}
        {(config.title || config.subtitle) && (
          <View style={styles.header}>
            <View style={styles.headerText}>
              {config.title && (
                <Text style={styles.title} accessibilityRole="header">
                  {config.title}
                </Text>
              )}
              {config.subtitle && <Text style={styles.subtitle}>{config.subtitle}</Text>}
            </View>
            {config.onEditPress && (
              <TouchableOpacity
                onPress={handleEditPress}
                style={styles.editButton}
                accessibilityRole="button"
                accessibilityLabel="Edit"
                testID={config.testID ? `${config.testID}-edit` : 'detail-card-edit'}
              >
                <Text style={styles.editButtonText}>Edit</Text>
              </TouchableOpacity>
            )}
          </View>
        )}

        {/* Content */}
        {isLoading ? (
          <View>
            {Array.from({ length: Math.max(skeletonCount, 3) }, (_, i) => (
              <FieldSkeleton key={i} tokens={tokens} />
            ))}
          </View>
        ) : (
          config.sections.map((section, sectionIdx) => (
            <View key={sectionIdx}>
              {section.title && (
                <View style={styles.sectionHeader}>
                  <Text style={styles.sectionTitle}>{section.title.toUpperCase()}</Text>
                </View>
              )}
              {section.fields.map((field, fieldIdx) => {
                const rawValue: string | undefined = isFromRef(field.value)
                  ? resolveFromRef<string>(field.value as unknown as string, values)
                  : (field.value as string)
                const displayValue = rawValue != null ? String(rawValue) : ''
                const isLast =
                  fieldIdx === section.fields.length - 1 &&
                  sectionIdx === config.sections.length - 1
                const testID = config.testID
                  ? `${config.testID}-field-${field.label.toLowerCase().replace(/\s+/g, '-')}`
                  : `detail-card-field-${field.label.toLowerCase().replace(/\s+/g, '-')}`

                return (
                  <View
                    key={fieldIdx}
                    style={[styles.fieldRow, isLast && styles.fieldRowLast]}
                    accessibilityRole="text"
                    accessibilityLabel={`${field.label}: ${displayValue}`}
                  >
                    <Text style={styles.fieldLabel} numberOfLines={1}>
                      {field.label}
                    </Text>
                    <View style={styles.fieldValue}>
                      <FieldValue
                        type={field.type}
                        value={displayValue}
                        tokens={tokens}
                        onDispatch={handleOpenUrl}
                        testID={testID}
                      />
                    </View>
                  </View>
                )
              })}
            </View>
          ))
        )}
      </View>
    </ComponentWrapper>
  )
}

// ---------------------------------------------------------------------------
// Styles
// ---------------------------------------------------------------------------

function makeStyles(tokens: DesignTokens) {
  return StyleSheet.create({
    card: {
      backgroundColor: tokens.colors.surface,
      borderRadius: tokens.radius.lg,
      borderWidth: 1,
      borderColor: tokens.colors.border,
      overflow: 'hidden',
      ...tokens.shadows.sm,
    },
    header: {
      flexDirection: 'row',
      alignItems: 'flex-start',
      justifyContent: 'space-between',
      paddingHorizontal: tokens.spacing[4],
      paddingVertical: tokens.spacing[4],
      borderBottomWidth: StyleSheet.hairlineWidth,
      borderBottomColor: tokens.colors.divider,
    },
    headerText: {
      flex: 1,
    },
    title: {
      fontSize: tokens.typography.fontSizeLg,
      fontWeight: tokens.typography.fontWeightSemibold,
      color: tokens.colors.text,
    },
    subtitle: {
      fontSize: tokens.typography.fontSizeSm,
      color: tokens.colors.textMuted,
      marginTop: tokens.spacing[1],
    },
    editButton: {
      marginLeft: tokens.spacing[3],
      paddingHorizontal: tokens.spacing[3],
      paddingVertical: tokens.spacing[1],
      borderRadius: tokens.radius.md,
      borderWidth: 1,
      borderColor: tokens.colors.border,
    },
    editButtonText: {
      fontSize: tokens.typography.fontSizeSm,
      color: tokens.colors.text,
      fontWeight: tokens.typography.fontWeightMedium,
    },
    sectionHeader: {
      paddingHorizontal: tokens.spacing[4],
      paddingVertical: tokens.spacing[2],
      backgroundColor: tokens.colors.surfaceAlt,
    },
    sectionTitle: {
      fontSize: tokens.typography.fontSizeSm,
      fontWeight: tokens.typography.fontWeightSemibold,
      color: tokens.colors.textMuted,
      letterSpacing: 0.8,
    },
    fieldRow: {
      flexDirection: 'row',
      alignItems: 'center',
      paddingHorizontal: tokens.spacing[4],
      paddingVertical: tokens.spacing[3],
      borderBottomWidth: StyleSheet.hairlineWidth,
      borderBottomColor: tokens.colors.divider,
    },
    fieldRowLast: {
      borderBottomWidth: 0,
    },
    fieldLabel: {
      width: 120,
      flexShrink: 0,
      fontSize: tokens.typography.fontSizeSm,
      color: tokens.colors.textMuted,
      marginRight: tokens.spacing[3],
    },
    fieldValue: {
      flex: 1,
    },
  })
}

