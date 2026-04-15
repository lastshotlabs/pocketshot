import React, { useCallback, useMemo } from 'react'
import { View, Text, TouchableOpacity, StyleSheet, FlatList, ActivityIndicator } from 'react-native'
import { ComponentWrapper } from '../../_base/ComponentWrapper'
import { useTokens } from '../../../context/AppContext'
import { useScreenContext } from '../../../context/ScreenContext'
import { useComponentData } from '../../_base/useComponentData'
import type { DesignTokens } from '../../../tokens/types'
import type { AuditLogConfig, AuditEntry, AuditListItem } from './types'

const AVATAR_SIZE = 32
const DOT_SIZE = 10

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

function getSeverityColor(severity: AuditEntry['severity'], tokens: DesignTokens): string {
  switch (severity) {
    case 'success': return tokens.colors.success
    case 'warning': return tokens.colors.warning
    case 'error': return tokens.colors.error
    case 'info':
    default: return tokens.colors.info
  }
}

function buildListItems(
  entries: AuditEntry[],
  groupByDate: boolean,
  maxItems?: number,
): AuditListItem[] {
  const limited = maxItems != null ? entries.slice(0, maxItems) : entries
  if (!groupByDate) {
    return limited.map((entry) => ({ type: 'entry', key: entry.id, entry }))
  }

  const items: AuditListItem[] = []
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

function SkeletonRow({ tokens, styles }: { tokens: DesignTokens; styles: ReturnType<typeof makeStyles> }) {
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

export function AuditLog({ config }: { config: AuditLogConfig }) {
  const tokens = useTokens()
  const { setValue, dispatch } = useScreenContext()
  const styles = useMemo(() => makeStyles(tokens), [tokens])

  const { data: fetchedData, isLoading, error } = useComponentData<AuditEntry[]>(config.data)

  const entries: AuditEntry[] = useMemo(
    () => (Array.isArray(fetchedData) ? fetchedData : []),
    [fetchedData],
  )

  const listItems: AuditListItem[] = useMemo(
    () => buildListItems(entries, config.groupByDate, config.maxItems),
    [entries, config.groupByDate, config.maxItems],
  )

  const handleItemPress = useCallback(
    async (entry: AuditEntry) => {
      if (config.id) setValue(config.id, entry)
      if (config.onItemPress) await dispatch(config.onItemPress)
    },
    [config.id, config.onItemPress, dispatch, setValue],
  )

  const keyExtractor = useCallback((item: AuditListItem) => item.key, [])

  const renderItem = useCallback(
    ({ item, index }: { item: AuditListItem; index: number }) => {
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
          onPress={() => handleItemPress(entry)}
          activeOpacity={config.onItemPress ? 0.7 : 1}
          style={[styles.entryRow, !isLast && styles.entryBorder]}
          accessibilityRole="button"
          accessibilityLabel={`${entry.actor?.name ?? 'System'} ${entry.action}${entry.target ? ` ${entry.target}` : ''}`}
          testID={config.testID ? `${config.testID}-entry-${entry.id}` : undefined}
        >
          <View style={[styles.dot, { backgroundColor: dotColor }]} />
          <View style={styles.entryMiddle}>
            <Text style={styles.entryAction} numberOfLines={2}>
              {config.showActor && entry.actor ? (
                <Text style={styles.actorName}>{entry.actor.name} </Text>
              ) : null}
              <Text style={styles.actionVerb}>{entry.action}</Text>
              {entry.target ? (
                <Text style={styles.targetText}>{` ${entry.target}`}</Text>
              ) : null}
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
    [config, tokens, styles, listItems.length, handleItemPress],
  )

  if (isLoading) {
    return (
      <ComponentWrapper id={config.id} testID={config.testID} config={config}>
        <View style={styles.container}>
          {Array.from({ length: 4 }).map((_, i) => (
            <SkeletonRow key={i} tokens={tokens} styles={styles} />
          ))}
        </View>
      </ComponentWrapper>
    )
  }

  if (error) {
    return (
      <ComponentWrapper id={config.id} testID={config.testID} config={config}>
        <View style={styles.emptyContainer}>
          <Text style={styles.emptyText}>Failed to load audit log</Text>
        </View>
      </ComponentWrapper>
    )
  }

  if (listItems.length === 0) {
    return (
      <ComponentWrapper id={config.id} testID={config.testID} config={config}>
        <View style={styles.emptyContainer}>
          <Text style={styles.emptyText}>{config.emptyMessage}</Text>
        </View>
      </ComponentWrapper>
    )
  }

  return (
    <ComponentWrapper id={config.id} testID={config.testID} config={config}>
      <View style={styles.container}>
        <FlatList
          data={listItems}
          renderItem={renderItem}
          keyExtractor={keyExtractor}
          scrollEnabled={false}
          removeClippedSubviews={false}
        />
      </View>
    </ComponentWrapper>
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

