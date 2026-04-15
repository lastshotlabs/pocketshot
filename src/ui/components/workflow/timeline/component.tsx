import React, { useCallback } from 'react'
import { View, Text, FlatList, StyleSheet, ActivityIndicator } from 'react-native'
import { ComponentWrapper } from '../../_base/ComponentWrapper'
import { resolveNativeTextStyle } from '../../_base'
import { useTokens } from '../../../context/AppContext'
import { useComponentData } from '../../_base/useComponentData'
import type { DesignTokens } from '../../../tokens/types'
import type { TimelineConfig, TimelineItem } from './types'

const DOT_SIZE = 12
const LINE_WIDTH = 2

export function Timeline({ config }: { config: TimelineConfig }) {
  const tokens = useTokens()
  const styles = makeStyles(tokens, config)

  const { data: fetchedItems, isLoading } = useComponentData<TimelineItem[]>(config.data)

  const staticItems = config.items ?? []
  const remoteItems = Array.isArray(fetchedItems) ? fetchedItems : []
  const allItems = [...staticItems, ...remoteItems]

  const renderItem = useCallback(
    ({ item, index }: { item: TimelineItem; index: number }) => {
      const isLast = index === allItems.length - 1
      const dotColor = item.color ?? tokens.colors.primary

      return (
        <View style={styles.itemRow}>
          <View style={styles.leftColumn}>
            <View style={[styles.dot, { backgroundColor: dotColor }]}>
              {item.icon != null ? (
                <Text
                  style={styles.dotIcon}
                  accessibilityElementsHidden
                  importantForAccessibility="no"
                >
                  {item.icon}
                </Text>
              ) : null}
            </View>
            {!isLast ? <View style={styles.line} /> : null}
          </View>
          <View style={styles.content}>
            <Text style={styles.title}>{item.title}</Text>
            {item.description != null ? (
              <Text style={styles.description}>{item.description}</Text>
            ) : null}
            {item.timestamp != null ? <Text style={styles.timestamp}>{item.timestamp}</Text> : null}
          </View>
        </View>
      )
    },
    [allItems.length, tokens, styles],
  )

  const keyExtractor = useCallback((item: TimelineItem) => item.id, [])

  if (isLoading && allItems.length === 0) {
    return (
      <ComponentWrapper id={config.id} testID={config.testID} config={config}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="small" color={tokens.colors.primary} />
        </View>
      </ComponentWrapper>
    )
  }

  return (
    <ComponentWrapper id={config.id} testID={config.testID} config={config}>
      <FlatList
        data={allItems}
        renderItem={renderItem}
        keyExtractor={keyExtractor}
        scrollEnabled={false}
        style={styles.list}
      />
    </ComponentWrapper>
  )
}

function makeStyles(tokens: DesignTokens, config: TimelineConfig) {
  const sharedTextStyle = resolveNativeTextStyle(config as Record<string, unknown>, tokens)
  const baseFontSize =
    typeof sharedTextStyle.fontSize === 'number'
      ? sharedTextStyle.fontSize
      : tokens.typography.fontSizeMd
  const baseColor =
    typeof sharedTextStyle.color === 'string' ? sharedTextStyle.color : tokens.colors.text
  const textAlign =
    sharedTextStyle.textAlign === 'center' ||
    sharedTextStyle.textAlign === 'right' ||
    sharedTextStyle.textAlign === 'justify'
      ? sharedTextStyle.textAlign
      : 'left'
  const lineHeight =
    typeof sharedTextStyle.lineHeight === 'number'
      ? sharedTextStyle.lineHeight
      : baseFontSize * tokens.typography.lineHeightNormal
  const letterSpacing =
    typeof sharedTextStyle.letterSpacing === 'number'
      ? sharedTextStyle.letterSpacing
      : undefined

  return StyleSheet.create({
    list: {
      width: '100%',
    },
    loadingContainer: {
      paddingVertical: tokens.spacing[4],
      alignItems: 'center',
    },
    itemRow: {
      flexDirection: 'row',
      alignItems: 'flex-start',
    },
    leftColumn: {
      alignItems: 'center',
      width: DOT_SIZE + tokens.spacing[3],
      marginRight: tokens.spacing[3],
    },
    dot: {
      width: DOT_SIZE,
      height: DOT_SIZE,
      borderRadius: DOT_SIZE / 2,
      alignItems: 'center',
      justifyContent: 'center',
      marginTop: 3,
    },
    dotIcon: {
      fontSize: 8,
      lineHeight: 10,
    },
    line: {
      width: LINE_WIDTH,
      flex: 1,
      minHeight: tokens.spacing[6],
      backgroundColor: tokens.colors.border,
      marginTop: tokens.spacing[1],
    },
    content: {
      flex: 1,
      paddingBottom: tokens.spacing[4],
    },
    title: {
      fontSize: baseFontSize,
      color: baseColor,
      fontWeight:
        typeof sharedTextStyle.fontWeight === 'string'
          ? sharedTextStyle.fontWeight
          : tokens.typography.fontWeightSemibold,
      textAlign,
      lineHeight,
      letterSpacing,
    },
    description: {
      fontSize: Math.max(baseFontSize - 2, tokens.typography.fontSizeXs),
      color: typeof sharedTextStyle.color === 'string' ? baseColor : tokens.colors.textMuted,
      marginTop: tokens.spacing[1],
      lineHeight: Math.max(lineHeight - 2, tokens.typography.fontSizeSm),
      textAlign,
      letterSpacing,
    },
    timestamp: {
      fontSize: Math.max(baseFontSize - 4, tokens.typography.fontSizeXs),
      color: typeof sharedTextStyle.color === 'string' ? baseColor : tokens.colors.textMuted,
      marginTop: tokens.spacing[1],
      textAlign,
      letterSpacing,
    },
  })
}

