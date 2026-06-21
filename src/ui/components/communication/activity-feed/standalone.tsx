import React, { useCallback } from 'react'
import {
  ActivityIndicator,
  FlatList,
  Image,
  StyleSheet,
  Text,
  View,
  type ViewStyle,
} from 'react-native'
import { useTokens } from '../../../context/AppContext'
import type { DesignTokens } from '../../../tokens/types'

const AVATAR_SIZE = 36
const TIMELINE_DOT_SIZE = 8
const TIMELINE_LINE_WIDTH = 2

export interface ActivityFeedBaseItem {
  id: string
  actorName?: string
  actorAvatar?: string
  action?: string
  target?: string
  timestamp?: string
}

export interface ActivityFeedBaseProps {
  /** Activity items to render. */
  items: ActivityFeedBaseItem[]
  /** Loading state. */
  loading?: boolean
  /** Error state. */
  error?: boolean
  /** Empty state message. */
  emptyMessage?: string
  /** Item row height. */
  itemHeight?: number
  style?: ViewStyle
  testID?: string
  id?: string
}

function ActivityItemRow({
  item,
  isLast,
  tokens,
  itemHeight,
}: {
  item: ActivityFeedBaseItem
  isLast: boolean
  tokens: DesignTokens
  itemHeight: number
}) {
  const styles = makeItemStyles(tokens, isLast, itemHeight)
  const initials = item.actorName ? item.actorName.slice(0, 2).toUpperCase() : '?'

  return (
    <View style={[styles.row, { minHeight: itemHeight }]} accessibilityRole="text">
      <View style={styles.timelineColumn}>
        <View style={styles.timelineDot} />
        {!isLast && <View style={styles.timelineLine} />}
      </View>

      <View style={styles.avatarColumn}>
        {item.actorAvatar ? (
          <Image
            source={{ uri: item.actorAvatar }}
            style={styles.avatar}
            accessibilityLabel={item.actorName ?? 'Activity actor'}
            resizeMode="cover"
          />
        ) : (
          <View style={styles.avatarFallback}>
            <Text style={styles.avatarInitials}>{initials}</Text>
          </View>
        )}
      </View>

      <View style={styles.content}>
        <Text style={styles.activityText} numberOfLines={2}>
          <Text style={styles.actorName}>{item.actorName ?? 'Someone'}</Text>
          {item.action != null && <Text style={styles.actionText}> {item.action}</Text>}
          {item.target != null && <Text style={styles.targetText}> {item.target}</Text>}
        </Text>
        {item.timestamp != null && <Text style={styles.timestamp}>{item.timestamp}</Text>}
      </View>
    </View>
  )
}

/**
 * Standalone ActivityFeed — plain React props, no manifest required.
 *
 * @example
 * <ActivityFeedBase items={[{ id: '1', actorName: 'Ada', action: 'commented' }]} />
 */
export function ActivityFeedBase({
  items,
  loading,
  error,
  emptyMessage = 'No activity yet',
  itemHeight = 72,
  style,
  testID,
  id,
}: ActivityFeedBaseProps) {
  const tokens = useTokens()
  const containerStyles = makeContainerStyles(tokens)

  const renderItem = useCallback(
    ({ item, index }: { item: ActivityFeedBaseItem; index: number }) => (
      <ActivityItemRow
        item={item}
        isLast={index === items.length - 1}
        tokens={tokens}
        itemHeight={itemHeight}
      />
    ),
    [items.length, tokens, itemHeight],
  )

  const keyExtractor = useCallback((item: ActivityFeedBaseItem) => item.id, [])

  if (loading) {
    return (
      <View style={[containerStyles.loadingContainer, style]} testID={testID ?? id}>
        <ActivityIndicator color={tokens.colors.primary} />
      </View>
    )
  }

  if (error) {
    return (
      <View style={[containerStyles.emptyContainer, style]} testID={testID ?? id}>
        <Text style={containerStyles.emptyText}>Failed to load activity</Text>
      </View>
    )
  }

  if (items.length === 0) {
    return (
      <View style={[containerStyles.emptyContainer, style]} testID={testID ?? id}>
        <Text style={containerStyles.emptyText}>{emptyMessage}</Text>
      </View>
    )
  }

  return (
    <FlatList<ActivityFeedBaseItem>
      data={items}
      renderItem={renderItem}
      keyExtractor={keyExtractor}
      getItemLayout={(_d, index) => ({ length: itemHeight, offset: itemHeight * index, index })}
      showsVerticalScrollIndicator={false}
      style={style}
      testID={testID ?? id}
    />
  )
}

function makeContainerStyles(tokens: DesignTokens) {
  return StyleSheet.create({
    loadingContainer: {
      paddingVertical: tokens.spacing[8],
      alignItems: 'center',
      justifyContent: 'center',
    },
    emptyContainer: {
      paddingVertical: tokens.spacing[8],
      alignItems: 'center',
      justifyContent: 'center',
    },
    emptyText: {
      fontSize: tokens.typography.fontSizeMd,
      color: tokens.colors.textMuted,
    },
  })
}

function makeItemStyles(tokens: DesignTokens, isLast: boolean, itemHeight: number) {
  return StyleSheet.create({
    row: {
      flexDirection: 'row',
      paddingRight: tokens.spacing[4],
      paddingVertical: tokens.spacing[2],
      minHeight: itemHeight,
    },
    timelineColumn: {
      width: tokens.spacing[6],
      alignItems: 'center',
    },
    timelineDot: {
      width: TIMELINE_DOT_SIZE,
      height: TIMELINE_DOT_SIZE,
      borderRadius: TIMELINE_DOT_SIZE / 2,
      backgroundColor: tokens.colors.primary,
      marginTop: (AVATAR_SIZE - TIMELINE_DOT_SIZE) / 2,
    },
    timelineLine: {
      width: TIMELINE_LINE_WIDTH,
      flex: 1,
      backgroundColor: tokens.colors.divider,
      marginTop: tokens.spacing[1],
      display: isLast ? 'none' : 'flex',
    },
    avatarColumn: {
      width: AVATAR_SIZE + tokens.spacing[3],
      alignItems: 'center',
    },
    avatar: {
      width: AVATAR_SIZE,
      height: AVATAR_SIZE,
      borderRadius: AVATAR_SIZE / 2,
    },
    avatarFallback: {
      width: AVATAR_SIZE,
      height: AVATAR_SIZE,
      borderRadius: AVATAR_SIZE / 2,
      backgroundColor: tokens.colors.surfaceAlt,
      alignItems: 'center',
      justifyContent: 'center',
    },
    avatarInitials: {
      fontSize: tokens.typography.fontSizeSm,
      fontWeight: tokens.typography.fontWeightSemibold,
      color: tokens.colors.text,
    },
    content: {
      flex: 1,
      justifyContent: 'center',
    },
    activityText: {
      fontSize: tokens.typography.fontSizeSm,
      color: tokens.colors.text,
      lineHeight: tokens.typography.fontSizeSm * tokens.typography.lineHeightNormal,
    },
    actorName: {
      fontWeight: tokens.typography.fontWeightSemibold,
      color: tokens.colors.text,
    },
    actionText: {
      color: tokens.colors.textMuted,
    },
    targetText: {
      fontWeight: tokens.typography.fontWeightMedium,
      color: tokens.colors.primary,
    },
    timestamp: {
      fontSize: tokens.typography.fontSizeXs,
      color: tokens.colors.textMuted,
      marginTop: tokens.spacing[1],
    },
  })
}
