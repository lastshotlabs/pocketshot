import React, { useCallback, useMemo } from 'react'
import {
  ActivityIndicator,
  FlatList,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
  type ViewStyle,
} from 'react-native'
import { useTokens } from '../../../context/AppContext'
import type { DesignTokens } from '../../../tokens/types'

const AVATAR_SIZE = 32
const DOT_SIZE = 10

export interface AuditLogBaseEntry {
  id: string
  actor?: { name: string; avatarUrl?: string }
  action: string
  target?: string
  targetType?: string
  detail?: string
  createdAt: string
  severity?: 'info' | 'warning' | 'error' | 'success'
}

export type AuditLogBaseListItem =
  | { type: 'header'; key: string; label: string }
  | { type: 'entry'; key: string; entry: AuditLogBaseEntry }

export interface AuditLogBaseProps {
  /** Entries to render. */
  entries: AuditLogBaseEntry[]
  /** Group entries by date. */
  groupByDate?: boolean
  /** Maximum entries to show. */
  maxItems?: number
  /** Show the actor's name on each entry. */
  showActor?: boolean
  /** Loading state. */
  loading?: boolean
  /** Error state. */
  error?: boolean
  /** Empty state message. */
  emptyMessage?: string
  /** Called when an entry is pressed. */
  onItemPress?: (entry: AuditLogBaseEntry) => void
  style?: ViewStyle
  testID?: string
  id?: string
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
  const d = new Date(isoString)
  return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
}

function getDateGroupLabel(isoString: string): string {
  const now = new Date()
  const d = new Date(isoString)
  const nowDay = new Date(now.getFullYear(), now.getMonth(), now.getDate())
  const thenDay = new Date(d.getFullYear(), d.getMonth(), d.getDate())
  const diffDays = Math.round((nowDay.getTime() - thenDay.getTime()) / 86400000)
  if (diffDays === 0) return 'Today'
  if (diffDays === 1) return 'Yesterday'
  return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
}

function getSeverityColor(severity: AuditLogBaseEntry['severity'], tokens: DesignTokens): string {
  switch (severity) {
    case 'success':
      return tokens.colors.success
    case 'warning':
      return tokens.colors.warning
    case 'error':
      return tokens.colors.error
    case 'info':
    default:
      return tokens.colors.info
  }
}

function buildListItems(
  entries: AuditLogBaseEntry[],
  groupByDate: boolean,
  maxItems?: number,
): AuditLogBaseListItem[] {
  const limited = maxItems != null ? entries.slice(0, maxItems) : entries
  if (!groupByDate) {
    return limited.map((entry) => ({ type: 'entry', key: entry.id, entry }))
  }

  const items: AuditLogBaseListItem[] = []
  let lastLabel: string | null = null
  for (const entry of limited) {
    const label = getDateGroupLabel(entry.createdAt)
    if (label !== lastLabel) {
      items.push({ type: 'header', key: `header-${label}`, label })
      lastLabel = label
    }
    items.push({ type: 'entry', key: entry.id, entry })
  }
  return items
}

function SkeletonRow({
  tokens,
  styles,
}: {
  tokens: DesignTokens
  styles: ReturnType<typeof makeStyles>
}) {
  return (
    <View style={styles.entryRow}>
      <View style={[styles.dot, { backgroundColor: tokens.colors.border }]} />
      <View style={styles.entryMiddle}>
        <View style={[styles.skeletonLine, { width: '70%' }]} />
        <View style={[styles.skeletonLine, { width: '45%', marginTop: tokens.spacing[1] }]} />
      </View>
    </View>
  )
}

/**
 * Standalone AuditLog — plain React props, no manifest required.
 *
 * @example
 * <AuditLogBase entries={[{ id: '1', action: 'created', createdAt: new Date().toISOString() }]} />
 */
export function AuditLogBase({
  entries,
  groupByDate = false,
  maxItems,
  showActor = true,
  loading,
  error,
  emptyMessage = 'No activity yet',
  onItemPress,
  style,
  testID,
  id,
}: AuditLogBaseProps) {
  const tokens = useTokens()
  const styles = useMemo(() => makeStyles(tokens), [tokens])

  const listItems = useMemo(
    () => buildListItems(entries, groupByDate, maxItems),
    [entries, groupByDate, maxItems],
  )

  const keyExtractor = useCallback((item: AuditLogBaseListItem) => item.key, [])

  const renderItem = useCallback(
    ({ item, index }: { item: AuditLogBaseListItem; index: number }) => {
      if (item.type === 'header') {
        return (
          <View style={styles.dateHeader}>
            <Text style={styles.dateHeaderText}>{item.label.toUpperCase()}</Text>
          </View>
        )
      }

      const { entry } = item
      const dotColor = getSeverityColor(entry.severity, tokens)
      const isLast = index === listItems.length - 1

      return (
        <TouchableOpacity
          onPress={() => onItemPress?.(entry)}
          activeOpacity={onItemPress ? 0.7 : 1}
          style={[styles.entryRow, !isLast && styles.entryBorder]}
          accessibilityRole="button"
          accessibilityLabel={`${entry.actor?.name ?? 'System'} ${entry.action}${entry.target ? ` ${entry.target}` : ''}`}
          testID={testID ? `${testID}-entry-${entry.id}` : undefined}
        >
          <View style={[styles.dot, { backgroundColor: dotColor }]} />
          <View style={styles.entryMiddle}>
            <Text style={styles.entryAction} numberOfLines={2}>
              {showActor && entry.actor ? (
                <Text style={styles.actorName}>{entry.actor.name} </Text>
              ) : null}
              <Text style={styles.actionVerb}>{entry.action}</Text>
              {entry.target ? <Text style={styles.targetText}>{` ${entry.target}`}</Text> : null}
            </Text>
            {entry.detail ? (
              <Text style={styles.entryDetail} numberOfLines={2}>
                {entry.detail}
              </Text>
            ) : null}
          </View>
          <Text style={styles.timestamp}>{formatRelativeTime(entry.createdAt)}</Text>
        </TouchableOpacity>
      )
    },
    [tokens, styles, listItems.length, onItemPress, showActor, testID],
  )

  if (loading) {
    return (
      <View style={[styles.container, style]} testID={testID ?? id}>
        {Array.from({ length: 4 }).map((_, i) => (
          <SkeletonRow key={i} tokens={tokens} styles={styles} />
        ))}
      </View>
    )
  }

  if (error) {
    return (
      <View style={[styles.emptyContainer, style]} testID={testID ?? id}>
        <Text style={styles.emptyText}>Failed to load audit log</Text>
      </View>
    )
  }

  if (listItems.length === 0) {
    return (
      <View style={[styles.emptyContainer, style]} testID={testID ?? id}>
        <Text style={styles.emptyText}>{emptyMessage}</Text>
      </View>
    )
  }

  return (
    <View style={[styles.container, style]} testID={testID ?? id}>
      <FlatList
        data={listItems}
        renderItem={renderItem}
        keyExtractor={keyExtractor}
        scrollEnabled={false}
        removeClippedSubviews={false}
      />
    </View>
  )
}

function makeStyles(tokens: DesignTokens) {
  return StyleSheet.create({
    container: {
      backgroundColor: tokens.colors.surface,
      borderRadius: tokens.radius.lg,
      overflow: 'hidden',
      ...tokens.shadows.sm,
    },
    dateHeader: {
      backgroundColor: tokens.colors.surfaceAlt,
      paddingHorizontal: tokens.spacing[4],
      paddingVertical: tokens.spacing[2],
    },
    dateHeaderText: {
      fontSize: tokens.typography.fontSizeXs,
      color: tokens.colors.textMuted,
      fontWeight: tokens.typography.fontWeightSemibold,
      letterSpacing: 0.8,
    },
    entryRow: {
      flexDirection: 'row',
      alignItems: 'flex-start',
      paddingHorizontal: tokens.spacing[4],
      paddingVertical: tokens.spacing[3],
      gap: tokens.spacing[3],
    },
    entryBorder: {
      borderBottomWidth: StyleSheet.hairlineWidth,
      borderBottomColor: tokens.colors.divider,
    },
    dot: {
      width: DOT_SIZE,
      height: DOT_SIZE,
      borderRadius: DOT_SIZE / 2,
      marginTop: 3,
      flexShrink: 0,
    },
    entryMiddle: {
      flex: 1,
    },
    entryAction: {
      fontSize: tokens.typography.fontSizeSm,
      color: tokens.colors.text,
      lineHeight: tokens.typography.fontSizeSm * tokens.typography.lineHeightNormal,
    },
    actorName: {
      fontWeight: tokens.typography.fontWeightSemibold,
      color: tokens.colors.text,
    },
    actionVerb: {
      color: tokens.colors.textMuted,
    },
    targetText: {
      fontWeight: tokens.typography.fontWeightMedium,
      color: tokens.colors.primary,
    },
    entryDetail: {
      fontSize: tokens.typography.fontSizeXs,
      color: tokens.colors.textMuted,
      marginTop: tokens.spacing[1],
      lineHeight: tokens.typography.fontSizeXs * tokens.typography.lineHeightNormal,
    },
    timestamp: {
      fontSize: tokens.typography.fontSizeXs,
      color: tokens.colors.textMuted,
      flexShrink: 0,
      marginTop: 2,
    },
    emptyContainer: {
      paddingVertical: tokens.spacing[8],
      alignItems: 'center',
    },
    emptyText: {
      fontSize: tokens.typography.fontSizeSm,
      color: tokens.colors.textMuted,
    },
    skeletonLine: {
      height: 12,
      backgroundColor: tokens.colors.surfaceAlt,
      borderRadius: tokens.radius.sm,
    },
    avatarCircle: {
      width: AVATAR_SIZE,
      height: AVATAR_SIZE,
      borderRadius: AVATAR_SIZE / 2,
      backgroundColor: tokens.colors.surfaceAlt,
      alignItems: 'center',
      justifyContent: 'center',
      flexShrink: 0,
    },
    avatarInitial: {
      fontSize: tokens.typography.fontSizeSm,
      color: tokens.colors.textMuted,
      fontWeight: tokens.typography.fontWeightSemibold,
    },
  })
}
