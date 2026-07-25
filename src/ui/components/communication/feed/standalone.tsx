import React, { useCallback, useEffect, useMemo, useRef } from 'react'
import {
  Animated,
  FlatList,
  RefreshControl,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
  type ViewStyle,
} from 'react-native'
import { useTokens } from '../../../context/AppContext'
import type { DesignTokens } from '../../../tokens/types'

export interface FeedBaseItem {
  id: string
  title?: string
  body?: string
  author?: { name: string; avatarUrl?: string }
  createdAt?: string
  imageUrl?: string
  tags?: string[]
  likes?: number
  comments?: number
}

export interface FeedBaseProps {
  /** Feed items. */
  items: FeedBaseItem[]
  /** Show actor avatars. */
  showAvatars?: boolean
  /** Loading state shows skeleton cards. */
  loading?: boolean
  /** Number of skeleton cards to show. */
  loadingCount?: number
  /** Empty state message. */
  emptyMessage?: string
  /** Pull-to-refresh enabled. */
  refreshable?: boolean
  /** Refresh in progress. */
  refreshing?: boolean
  /** Called when user pulls to refresh. */
  onRefresh?: () => void
  /** Called when an item is pressed. */
  onItemPress?: (item: FeedBaseItem) => void
  /** Called when scrolled to end. */
  onLoadMore?: () => void
  style?: ViewStyle
  testID?: string
  id?: string
}

function SkeletonCard({ tokens }: { tokens: DesignTokens }) {
  const shimmer = useRef(new Animated.Value(0)).current

  useEffect(() => {
    const anim = Animated.loop(
      Animated.sequence([
        Animated.timing(shimmer, { toValue: 1, duration: 800, useNativeDriver: true }),
        Animated.timing(shimmer, { toValue: 0, duration: 800, useNativeDriver: true }),
      ]),
    )
    anim.start()
    return () => anim.stop()
  }, [shimmer])

  const opacity = shimmer.interpolate({ inputRange: [0, 1], outputRange: [0.4, 0.8] })
  const styles = makeStyles(tokens)

  return (
    <Animated.View style={[styles.card, { opacity }]}>
      <View style={styles.skeletonHeader}>
        <View style={[styles.skeletonAvatar, { backgroundColor: tokens.colors.surfaceAlt }]} />
        <View style={{ flex: 1, gap: tokens.spacing[1] }}>
          <View
            style={[
              styles.skeletonLine,
              { width: '40%', backgroundColor: tokens.colors.surfaceAlt },
            ]}
          />
          <View
            style={[
              styles.skeletonLine,
              { width: '25%', height: 8, backgroundColor: tokens.colors.surfaceAlt },
            ]}
          />
        </View>
      </View>
      <View
        style={[
          styles.skeletonLine,
          { width: '70%', marginTop: tokens.spacing[2], backgroundColor: tokens.colors.surfaceAlt },
        ]}
      />
      <View
        style={[
          styles.skeletonLine,
          {
            width: '100%',
            marginTop: tokens.spacing[1],
            backgroundColor: tokens.colors.surfaceAlt,
          },
        ]}
      />
      <View
        style={[
          styles.skeletonLine,
          { width: '85%', marginTop: tokens.spacing[1], backgroundColor: tokens.colors.surfaceAlt },
        ]}
      />
    </Animated.View>
  )
}

function Avatar({
  name,
  tokens,
  styles,
}: {
  name?: string
  tokens: DesignTokens
  styles: ReturnType<typeof makeStyles>
}) {
  const initials = useMemo(() => {
    if (!name) return '?'
    const parts = name.trim().split(/\s+/)
    if (parts.length === 1) return parts[0][0]?.toUpperCase() ?? '?'
    return ((parts[0][0] ?? '') + (parts[parts.length - 1][0] ?? '')).toUpperCase()
  }, [name])

  return (
    <View
      style={[styles.avatar, { backgroundColor: tokens.colors.primary }]}
      accessibilityElementsHidden
      importantForAccessibility="no"
    >
      <Text
        style={{
          color: tokens.colors.primaryForeground,
          fontSize: tokens.typography.fontSizeXs,
          fontWeight: tokens.typography.fontWeightBold,
        }}
      >
        {initials}
      </Text>
    </View>
  )
}

function TagChip({ label, tokens }: { label: string; tokens: DesignTokens }) {
  return (
    <View
      style={{
        backgroundColor: tokens.colors.badgeBackground,
        borderRadius: tokens.radius.full,
        paddingHorizontal: tokens.spacing[2],
        paddingVertical: tokens.spacing[1] / 2,
      }}
    >
      <Text
        style={{
          color: tokens.colors.badgeForeground,
          fontSize: tokens.typography.fontSizeXs,
          fontWeight: tokens.typography.fontWeightMedium,
        }}
      >
        {label}
      </Text>
    </View>
  )
}

function FeedItemCard({
  item,
  showAvatars,
  onPress,
  tokens,
  testID,
}: {
  item: FeedBaseItem
  showAvatars: boolean
  onPress?: (item: FeedBaseItem) => void
  tokens: DesignTokens
  testID?: string
}) {
  const styles = makeStyles(tokens)

  const handlePress = useCallback(() => onPress?.(item), [item, onPress])

  const formattedDate = useMemo(() => {
    if (!item.createdAt) return undefined
    try {
      const d = new Date(item.createdAt)
      const now = new Date()
      const diffMs = now.getTime() - d.getTime()
      const diffMin = Math.floor(diffMs / 60_000)
      if (diffMin < 1) return 'just now'
      if (diffMin < 60) return `${diffMin}m ago`
      const diffH = Math.floor(diffMin / 60)
      if (diffH < 24) return `${diffH}h ago`
      const diffD = Math.floor(diffH / 24)
      if (diffD < 7) return `${diffD}d ago`
      return d.toLocaleDateString(undefined, { month: 'short', day: 'numeric' })
    } catch {
      return item.createdAt
    }
  }, [item.createdAt])

  return (
    <TouchableOpacity
      onPress={handlePress}
      activeOpacity={0.75}
      accessibilityRole="button"
      accessibilityLabel={item.title ?? item.body ?? 'Feed item'}
      accessibilityHint="Tap to view details"
      testID={testID ?? `feed-item-${item.id}`}
    >
      <View style={styles.card}>
        <View style={styles.itemHeader}>
          {showAvatars ? <Avatar name={item.author?.name} tokens={tokens} styles={styles} /> : null}
          <View style={{ flex: 1 }}>
            <Text
              style={styles.authorName}
              numberOfLines={1}
              accessibilityElementsHidden
              importantForAccessibility="no"
            >
              {item.author?.name ?? 'Anonymous'}
            </Text>
          </View>
          {formattedDate ? (
            <Text
              style={styles.timestamp}
              accessibilityElementsHidden
              importantForAccessibility="no"
            >
              {formattedDate}
            </Text>
          ) : null}
        </View>

        {item.title ? <Text style={styles.itemTitle}>{item.title}</Text> : null}

        {item.body ? (
          <Text style={styles.itemBody} numberOfLines={3}>
            {item.body}
          </Text>
        ) : null}

        {item.imageUrl ? (
          <View style={styles.imagePlaceholder}>
            <Text
              style={{ color: tokens.colors.textMuted, fontSize: tokens.typography.fontSizeXs }}
            >
              📷 Image
            </Text>
          </View>
        ) : null}

        {item.tags && item.tags.length > 0 ? (
          <View style={styles.tagsRow}>
            {item.tags.map((tag) => (
              <TagChip key={tag} label={tag} tokens={tokens} />
            ))}
          </View>
        ) : null}

        {item.likes !== undefined || item.comments !== undefined ? (
          <View style={styles.footer}>
            {item.likes !== undefined ? (
              <Text style={styles.footerStat}>♡ {item.likes}</Text>
            ) : null}
            {item.comments !== undefined ? (
              <Text style={styles.footerStat}>💬 {item.comments}</Text>
            ) : null}
          </View>
        ) : null}
      </View>
    </TouchableOpacity>
  )
}

function EmptyState({ message, tokens }: { message: string; tokens: DesignTokens }) {
  return (
    <View
      style={{
        alignItems: 'center',
        justifyContent: 'center',
        paddingVertical: 64,
        paddingHorizontal: 24,
      }}
      accessibilityRole="text"
      accessibilityLabel={message}
    >
      <Text style={{ fontSize: 32, marginBottom: 12 }}>📭</Text>
      <Text
        style={{
          fontSize: tokens.typography.fontSizeMd,
          color: tokens.colors.textMuted,
          textAlign: 'center',
        }}
      >
        {message}
      </Text>
    </View>
  )
}

/**
 * Standalone Feed — plain React props, no manifest required.
 *
 * @example
 * <FeedBase items={[]} onItemPress={(item) => console.log(item)} />
 */
export function FeedBase({
  items,
  showAvatars = true,
  loading,
  loadingCount = 4,
  emptyMessage = 'Nothing here yet',
  refreshable,
  refreshing = false,
  onRefresh,
  onItemPress,
  onLoadMore,
  style,
  testID,
  id,
}: FeedBaseProps) {
  const tokens = useTokens()

  const keyExtractor = useCallback((item: FeedBaseItem) => item.id, [])

  const renderItem = useCallback(
    ({ item }: { item: FeedBaseItem }) => (
      <FeedItemCard
        item={item}
        showAvatars={showAvatars}
        onPress={onItemPress}
        tokens={tokens}
        testID={testID ? `${testID}-item-${item.id}` : undefined}
      />
    ),
    [showAvatars, testID, onItemPress, tokens],
  )

  const refreshControl =
    refreshable && onRefresh ? (
      <RefreshControl
        refreshing={refreshing}
        onRefresh={onRefresh}
        tintColor={tokens.colors.primary}
        colors={[tokens.colors.primary]}
      />
    ) : undefined

  if (loading) {
    return (
      <View style={style} testID={testID ?? id}>
        {Array.from({ length: loadingCount }).map((_, i) => (
          <SkeletonCard key={i} tokens={tokens} />
        ))}
      </View>
    )
  }

  return (
    <FlatList
      data={items}
      keyExtractor={keyExtractor}
      renderItem={renderItem}
      refreshControl={refreshControl}
      onEndReached={onLoadMore}
      onEndReachedThreshold={0.3}
      ListEmptyComponent={<EmptyState message={emptyMessage} tokens={tokens} />}
      contentContainerStyle={items.length === 0 ? { flex: 1 } : undefined}
      style={[{ flex: 1 }, style]}
      testID={testID ? `${testID}-list` : id}
      accessibilityRole="list"
      accessibilityLabel="Feed"
    />
  )
}

function makeStyles(tokens: DesignTokens) {
  return StyleSheet.create({
    card: {
      backgroundColor: tokens.colors.surface,
      borderRadius: tokens.radius.lg,
      marginHorizontal: tokens.spacing[4],
      marginBottom: tokens.spacing[3],
      padding: tokens.spacing[4],
      ...tokens.shadows.sm,
    },
    itemHeader: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: tokens.spacing[2],
    },
    avatar: {
      width: 32,
      height: 32,
      borderRadius: tokens.radius.full,
      alignItems: 'center',
      justifyContent: 'center',
      flexShrink: 0,
    },
    authorName: {
      fontSize: tokens.typography.fontSizeSm,
      fontWeight: tokens.typography.fontWeightSemibold,
      color: tokens.colors.text,
    },
    timestamp: {
      fontSize: tokens.typography.fontSizeXs,
      color: tokens.colors.textMuted,
      flexShrink: 0,
    },
    itemTitle: {
      fontSize: tokens.typography.fontSizeMd,
      fontWeight: tokens.typography.fontWeightSemibold,
      color: tokens.colors.text,
      marginTop: tokens.spacing[2],
    },
    itemBody: {
      fontSize: tokens.typography.fontSizeSm,
      color: tokens.colors.textMuted,
      marginTop: tokens.spacing[1],
      lineHeight: tokens.typography.fontSizeSm * tokens.typography.lineHeightNormal,
    },
    imagePlaceholder: {
      width: '100%',
      height: 200,
      borderRadius: tokens.radius.md,
      marginTop: tokens.spacing[2],
      backgroundColor: tokens.colors.surfaceAlt,
      alignItems: 'center',
      justifyContent: 'center',
      overflow: 'hidden',
    },
    tagsRow: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      gap: tokens.spacing[1],
      marginTop: tokens.spacing[2],
    },
    footer: {
      flexDirection: 'row',
      gap: tokens.spacing[3],
      marginTop: tokens.spacing[3],
      paddingTop: tokens.spacing[2],
      borderTopWidth: StyleSheet.hairlineWidth,
      borderTopColor: tokens.colors.divider,
    },
    footerStat: {
      fontSize: tokens.typography.fontSizeXs,
      color: tokens.colors.textMuted,
    },
    skeletonHeader: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 8,
    },
    skeletonAvatar: { width: 32, height: 32, borderRadius: 9999 },
    skeletonLine: { height: 12, borderRadius: 6 },
  })
}
