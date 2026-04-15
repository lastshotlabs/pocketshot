import React, { useCallback } from 'react'
import { View, Text, FlatList, Image, StyleSheet, ActivityIndicator } from 'react-native'
import { ComponentWrapper } from '../../_base/ComponentWrapper'
import { useTokens } from '../../../context/AppContext'
import { useComponentData } from '../../_base/useComponentData'
import type { DesignTokens } from '../../../tokens/types'
import type { ActivityFeedConfig, ActivityFeedItem } from './types'

const AVATAR_SIZE = 36
const TIMELINE_DOT_SIZE = 8
// 2px structural width for the timeline connector line; not a spacing unit
const TIMELINE_LINE_WIDTH = 2

function ActivityItemRow({
  item,
  isLast,
  tokens,
  itemHeight,
}: {
  item: ActivityFeedItem
  isLast: boolean
  tokens: DesignTokens
  itemHeight: number
}) {
  const styles = makeItemStyles(tokens, isLast, itemHeight)

  const initials = item.actorName ? item.actorName.slice(0, 2).toUpperCase() : '?'

  return (
    <View style={[styles.row, { minHeight: itemHeight }]} accessibilityRole="text">
      {/* Timeline column */}
      <View style={styles.timelineColumn}>
        <View style={styles.timelineDot} />
        {!isLast && <View style={styles.timelineLine} />}
      </View>

      {/* Avatar */}
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

      {/* Content */}
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

export function ActivityFeed({ config }: { config: ActivityFeedConfig }) {
  const tokens = useTokens()
  const { data, isLoading, error } = useComponentData<ActivityFeedItem[]>(config.data)

  const renderItem = useCallback(
    ({ item, index }: { item: ActivityFeedItem; index: number }) => {
      const items = data ?? []
      return (
        <ActivityItemRow
          item={item}
          isLast={index === items.length - 1}
          tokens={tokens}
          itemHeight={config.itemHeight ?? 72}
        />
      )
    },
    [data, tokens, config.itemHeight],
  )

  const keyExtractor = useCallback((item: ActivityFeedItem) => item.id, [])

  const containerStyles = makeContainerStyles(tokens)

  if (isLoading) {
    return (
      <ComponentWrapper id={config.id} testID={config.testID} config={config}>
        <View style={containerStyles.loadingContainer}>
          <ActivityIndicator color={tokens.colors.primary} />
        </View>
      </ComponentWrapper>
    )
  }

  if (error != null) {
    return (
      <ComponentWrapper id={config.id} testID={config.testID} config={config}>
        <View style={containerStyles.emptyContainer}>
          <Text style={containerStyles.emptyText}>Failed to load activity</Text>
        </View>
      </ComponentWrapper>
    )
  }

  if (!data || data.length === 0) {
    return (
      <ComponentWrapper id={config.id} testID={config.testID} config={config}>
        <View style={containerStyles.emptyContainer}>
          <Text style={containerStyles.emptyText}>{config.emptyMessage}</Text>
        </View>
      </ComponentWrapper>
    )
  }

  return (
    <ComponentWrapper id={config.id} testID={config.testID} config={config}>
      <FlatList<ActivityFeedItem>
        data={data}
        renderItem={renderItem}
        keyExtractor={keyExtractor}
        getItemLayout={(_d, index) => ({
          length: config.itemHeight ?? 72,
          offset: (config.itemHeight ?? 72) * index,
          index,
        })}
        showsVerticalScrollIndicator={false}
        testID={config.testID ?? config.id}
      />
    </ComponentWrapper>
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

