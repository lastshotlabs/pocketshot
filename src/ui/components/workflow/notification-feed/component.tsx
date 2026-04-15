import React, { useCallback, useMemo, useRef, useState } from 'react'
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  FlatList,
  RefreshControl,
  Animated,
} from 'react-native'
import { ComponentWrapper } from '../../_base/ComponentWrapper'
import { useTokens } from '../../../context/AppContext'
import { useScreenContext } from '../../../context/ScreenContext'
import { useComponentData } from '../../_base/useComponentData'
import type { DesignTokens } from '../../../tokens/types'
import type { NotificationFeedConfig, Notification, NotifListItem } from './types'

const UNREAD_DOT_SIZE = 8
const TYPE_ICON_MAP: Record<string, string> = {
  info: 'ℹ️',
  success: '✅',
  warning: '⚠️',
  error: '❌',
  mention: '@',
  follow: '👋',
  like: '❤️',
  system: '🔔',
}

function getNotifIcon(type: Notification['type']): string {
  return TYPE_ICON_MAP[type ?? 'system'] ?? '🔔'
}

function getDateGroupLabel(isoString: string): string {
  const now = new Date()
  const d = new Date(isoString)
  const nowDay = new Date(now.getFullYear(), now.getMonth(), now.getDate())
  const thenDay = new Date(d.getFullYear(), d.getMonth(), d.getDate())
  const diffDays = Math.round((nowDay.getTime() - thenDay.getTime()) / 86400000)
  if (diffDays === 0) return 'Today'
  if (diffDays <= 6) return 'Earlier this week'
  return 'Older'
}

function formatRelativeTime(isoString: string): string {
  const now = Date.now()
  const then = new Date(isoString).getTime()
  if (isNaN(then)) return ''
  const diffMs = now - then
  const diffSec = Math.floor(diffMs / 1000)
  if (diffSec < 60) return `${diffSec}s ago`
  const diffMin = Math.floor(diffSec / 60)
  if (diffMin < 60) return `${diffMin}m ago`
  const diffHr = Math.floor(diffMin / 60)
  if (diffHr < 24) return `${diffHr}h ago`
  const diffDay = Math.floor(diffHr / 24)
  if (diffDay < 7) return `${diffDay}d ago`
  return new Date(isoString).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
}

const GROUP_ORDER = ['Today', 'Earlier this week', 'Older']

function buildListItems(notifications: Notification[], dismissed: Set<string>): NotifListItem[] {
  const visible = notifications.filter((n) => !dismissed.has(n.id))
  const grouped: Record<string, Notification[]> = {}
  for (const n of visible) {
    const label = getDateGroupLabel(n.createdAt)
    if (!grouped[label]) grouped[label] = []
    grouped[label].push(n)
  }
  const items: NotifListItem[] = []
  for (const label of GROUP_ORDER) {
    const group = grouped[label]
    if (!group?.length) continue
    items.push({ type: 'header', key: `header-${label}`, label })
    for (const n of group) {
      items.push({ type: 'notification', key: n.id, notification: n })
    }
  }
  return items
}

interface NotifRowProps {
  notification: Notification
  isRead: boolean
  tokens: DesignTokens
  styles: ReturnType<typeof makeStyles>
  onPress: (n: Notification) => void
  onDismiss: (id: string) => void
  showDismiss: boolean
  testIDPrefix?: string
}

function NotifRow({
  notification,
  isRead,
  tokens,
  styles,
  onPress,
  onDismiss,
  showDismiss,
  testIDPrefix,
}: NotifRowProps) {
  const handlePress = useCallback(() => onPress(notification), [onPress, notification])
  const handleDismiss = useCallback(() => onDismiss(notification.id), [onDismiss, notification.id])
  const icon = getNotifIcon(notification.type)

  return (
    <TouchableOpacity
      onPress={handlePress}
      onLongPress={handleDismiss}
      delayLongPress={400}
      activeOpacity={0.8}
      style={[
        styles.notifRow,
        !isRead && { backgroundColor: tokens.colors.primary + '0d' },
        isRead && { backgroundColor: tokens.colors.background },
      ]}
      accessibilityRole="button"
      accessibilityLabel={`${notification.title}${notification.body ? `: ${notification.body}` : ''}${isRead ? '' : ', unread'}`}
      accessibilityHint="Long press to dismiss"
      testID={testIDPrefix ? `${testIDPrefix}-notif-${notification.id}` : undefined}
    >
      {!isRead ? (
        <View style={styles.unreadDot} accessibilityElementsHidden importantForAccessibility="no" />
      ) : null}
      <View style={styles.iconContainer} accessibilityElementsHidden importantForAccessibility="no">
        <Text style={styles.typeIcon}>{icon}</Text>
      </View>
      <View style={styles.notifContent}>
        <Text style={[styles.notifTitle, !isRead && styles.notifTitleUnread]} numberOfLines={1}>
          {notification.title}
        </Text>
        {notification.body ? (
          <Text style={styles.notifBody} numberOfLines={2}>
            {notification.body}
          </Text>
        ) : null}
      </View>
      <View style={styles.notifRight}>
        <Text style={styles.notifTime}>{formatRelativeTime(notification.createdAt)}</Text>
        {showDismiss ? (
          <TouchableOpacity
            onPress={handleDismiss}
            style={styles.dismissButton}
            accessibilityRole="button"
            accessibilityLabel="Dismiss notification"
            testID={testIDPrefix ? `${testIDPrefix}-dismiss-${notification.id}` : undefined}
          >
            <Text style={styles.dismissText}>×</Text>
          </TouchableOpacity>
        ) : null}
      </View>
    </TouchableOpacity>
  )
}

export function NotificationFeed({ config }: { config: NotificationFeedConfig }) {
  const tokens = useTokens()
  const { setValue, dispatch } = useScreenContext()
  const styles = useMemo(() => makeStyles(tokens), [tokens])

  const { data: fetchedData, isLoading } = useComponentData<Notification[]>(config.data)
  const [dismissed, setDismissed] = useState<Set<string>>(new Set())
  const [localReadIds, setLocalReadIds] = useState<Set<string>>(new Set())
  const [refreshing, setRefreshing] = useState(false)
  const [longPressedId, setLongPressedId] = useState<string | null>(null)

  const notifications: Notification[] = useMemo(
    () => (Array.isArray(fetchedData) ? fetchedData : []),
    [fetchedData],
  )

  const unreadCount = useMemo(
    () =>
      notifications.filter((n) => !n.isRead && !localReadIds.has(n.id) && !dismissed.has(n.id))
        .length,
    [notifications, localReadIds, dismissed],
  )

  const listItems = useMemo(
    () => buildListItems(notifications, dismissed),
    [notifications, dismissed],
  )

  const handleMarkAllRead = useCallback(async () => {
    const allIds = new Set(notifications.map((n) => n.id))
    setLocalReadIds(allIds)
    if (config.onMarkAllRead) await dispatch(config.onMarkAllRead)
  }, [notifications, config.onMarkAllRead, dispatch])

  const handleItemPress = useCallback(
    async (notification: Notification) => {
      setLocalReadIds((prev) => new Set([...prev, notification.id]))
      if (config.id) setValue('__pressedNotification', notification)
      if (config.onItemPress) await dispatch(config.onItemPress)
    },
    [config.id, config.onItemPress, dispatch, setValue],
  )

  const handleDismiss = useCallback((id: string) => {
    setDismissed((prev) => new Set([...prev, id]))
    setLongPressedId(null)
  }, [])

  const handleRefresh = useCallback(async () => {
    if (!config.refreshable) return
    setRefreshing(true)
    await dispatch({ type: 'refresh', target: config.id ?? 'screen' })
    setRefreshing(false)
  }, [config.id, config.refreshable, dispatch])

  const keyExtractor = useCallback((item: NotifListItem) => item.key, [])

  const renderItem = useCallback(
    ({ item }: { item: NotifListItem }) => {
      if (item.type === 'header') {
        return (
          <View style={styles.dateHeader}>
            <Text style={styles.dateHeaderText}>{item.label}</Text>
          </View>
        )
      }
      const { notification } = item
      const isRead = notification.isRead || localReadIds.has(notification.id)
      const showDismiss = longPressedId === notification.id

      return (
        <NotifRow
          notification={notification}
          isRead={isRead}
          tokens={tokens}
          styles={styles}
          onPress={handleItemPress}
          onDismiss={handleDismiss}
          showDismiss={showDismiss}
          testIDPrefix={config.testID}
        />
      )
    },
    [styles, tokens, localReadIds, longPressedId, handleItemPress, handleDismiss, config.testID],
  )

  const ListHeader = useMemo(
    () => (
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Notifications</Text>
        {config.showMarkAllRead && unreadCount > 0 ? (
          <TouchableOpacity
            onPress={handleMarkAllRead}
            accessibilityRole="button"
            accessibilityLabel={`Mark all ${unreadCount} notifications as read`}
            testID={config.testID ? `${config.testID}-mark-all-read` : undefined}
          >
            <Text style={styles.markAllReadText}>Mark all read</Text>
          </TouchableOpacity>
        ) : null}
      </View>
    ),
    [styles, config.showMarkAllRead, config.testID, unreadCount, handleMarkAllRead],
  )

  const ListEmpty = useMemo(() => {
    if (isLoading) {
      return (
        <View style={styles.skeletonContainer}>
          {Array.from({ length: 4 }).map((_, i) => (
            <View key={i} style={styles.skeletonRow}>
              <View style={styles.skeletonIcon} />
              <View style={styles.skeletonContent}>
                <View style={[styles.skeletonLine, { width: '65%' }]} />
                <View
                  style={[styles.skeletonLine, { width: '45%', marginTop: tokens.spacing[1] }]}
                />
              </View>
            </View>
          ))}
        </View>
      )
    }
    return (
      <View style={styles.emptyContainer}>
        <Text style={styles.emptyText}>{config.emptyMessage}</Text>
      </View>
    )
  }, [isLoading, styles, tokens, config.emptyMessage])

  return (
    <ComponentWrapper id={config.id} testID={config.testID} config={config}>
      <View style={styles.container}>
        <FlatList
          data={listItems}
          renderItem={renderItem}
          keyExtractor={keyExtractor}
          ListHeaderComponent={ListHeader}
          ListEmptyComponent={ListEmpty}
          refreshControl={
            config.refreshable ? (
              <RefreshControl
                refreshing={refreshing}
                onRefresh={handleRefresh}
                tintColor={tokens.colors.primary}
              />
            ) : undefined
          }
          ItemSeparatorComponent={() => <View style={styles.separator} />}
          contentContainerStyle={listItems.length === 0 ? styles.emptyFlex : undefined}
        />
      </View>
    </ComponentWrapper>
  )
}

function makeStyles(tokens: DesignTokens) {
  return StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: tokens.colors.background,
    },
    header: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      paddingHorizontal: tokens.spacing[4],
      paddingVertical: tokens.spacing[3],
      borderBottomWidth: StyleSheet.hairlineWidth,
      borderBottomColor: tokens.colors.divider,
      backgroundColor: tokens.colors.surface,
    },
    headerTitle: {
      fontSize: tokens.typography.fontSizeLg,
      color: tokens.colors.text,
      fontWeight: tokens.typography.fontWeightSemibold,
    },
    markAllReadText: {
      fontSize: tokens.typography.fontSizeSm,
      color: tokens.colors.primary,
      fontWeight: tokens.typography.fontWeightMedium,
    },
    dateHeader: {
      paddingHorizontal: tokens.spacing[4],
      paddingVertical: tokens.spacing[2],
      backgroundColor: tokens.colors.surfaceAlt,
    },
    dateHeaderText: {
      fontSize: tokens.typography.fontSizeXs,
      color: tokens.colors.textMuted,
      fontWeight: tokens.typography.fontWeightSemibold,
      letterSpacing: 0.5,
    },
    notifRow: {
      flexDirection: 'row',
      alignItems: 'flex-start',
      paddingHorizontal: tokens.spacing[4],
      paddingVertical: tokens.spacing[3],
      position: 'relative',
    },
    unreadDot: {
      position: 'absolute',
      left: tokens.spacing[2],
      top: tokens.spacing[3] + 10,
      width: UNREAD_DOT_SIZE,
      height: UNREAD_DOT_SIZE,
      borderRadius: UNREAD_DOT_SIZE / 2,
      backgroundColor: tokens.colors.primary,
    },
    iconContainer: {
      width: 36,
      height: 36,
      borderRadius: 18,
      backgroundColor: tokens.colors.surfaceAlt,
      alignItems: 'center',
      justifyContent: 'center',
      marginRight: tokens.spacing[3],
      flexShrink: 0,
    },
    typeIcon: {
      fontSize: tokens.typography.fontSizeSm,
    },
    notifContent: {
      flex: 1,
    },
    notifTitle: {
      fontSize: tokens.typography.fontSizeSm,
      color: tokens.colors.text,
      fontWeight: tokens.typography.fontWeightMedium,
    },
    notifTitleUnread: {
      fontWeight: tokens.typography.fontWeightSemibold,
    },
    notifBody: {
      fontSize: tokens.typography.fontSizeXs,
      color: tokens.colors.textMuted,
      marginTop: tokens.spacing[1],
      lineHeight: tokens.typography.fontSizeXs * tokens.typography.lineHeightNormal,
    },
    notifRight: {
      alignItems: 'flex-end',
      gap: tokens.spacing[2],
      marginLeft: tokens.spacing[2],
      flexShrink: 0,
    },
    notifTime: {
      fontSize: tokens.typography.fontSizeXs,
      color: tokens.colors.textMuted,
    },
    dismissButton: {
      width: 20,
      height: 20,
      borderRadius: 10,
      backgroundColor: tokens.colors.surfaceAlt,
      alignItems: 'center',
      justifyContent: 'center',
    },
    dismissText: {
      fontSize: tokens.typography.fontSizeMd,
      color: tokens.colors.textMuted,
      lineHeight: 20,
    },
    separator: {
      height: StyleSheet.hairlineWidth,
      backgroundColor: tokens.colors.divider,
    },
    emptyContainer: {
      flex: 1,
      alignItems: 'center',
      justifyContent: 'center',
      paddingVertical: tokens.spacing[16],
    },
    emptyFlex: {
      flexGrow: 1,
    },
    emptyText: {
      fontSize: tokens.typography.fontSizeMd,
      color: tokens.colors.textMuted,
      textAlign: 'center',
    },
    skeletonContainer: {
      paddingTop: tokens.spacing[2],
    },
    skeletonRow: {
      flexDirection: 'row',
      alignItems: 'center',
      paddingHorizontal: tokens.spacing[4],
      paddingVertical: tokens.spacing[3],
      gap: tokens.spacing[3],
    },
    skeletonIcon: {
      width: 36,
      height: 36,
      borderRadius: 18,
      backgroundColor: tokens.colors.surfaceAlt,
      flexShrink: 0,
    },
    skeletonContent: {
      flex: 1,
    },
    skeletonLine: {
      height: 12,
      backgroundColor: tokens.colors.surfaceAlt,
      borderRadius: tokens.radius.sm,
    },
  })
}
