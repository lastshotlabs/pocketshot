import React, { useCallback, useMemo, useRef, useState } from 'react'
import {
  Animated,
  FlatList,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
  type ListRenderItemInfo,
  type ViewStyle,
} from 'react-native'
import { useTokens } from '../../../context/AppContext'
import type { DesignTokens } from '../../../tokens/types'

const COLUMN_WIDTH = 280
const CARD_MIN_HEIGHT = 80
const PRIORITY_BORDER_WIDTH = 3

const PRIORITY_COLORS: Record<string, string> = {
  low: '#22c55e',
  medium: '#eab308',
  high: '#f97316',
  urgent: '#ef4444',
}

export interface KanbanBaseItem {
  id: string
  title: string
  description?: string
  tags?: string[]
  assignee?: { name: string; avatar?: string }
  priority?: 'low' | 'medium' | 'high' | 'urgent'
}

export interface KanbanBaseColumn {
  id: string
  title: string
  color?: string
  items: KanbanBaseItem[]
}

export interface KanbanBoardBaseProps {
  /** Columns to render. */
  columns: KanbanBaseColumn[]
  /** Called when a card is pressed. */
  onCardPress?: (item: KanbanBaseItem, columnId: string) => void
  /** Called when the user requests to move a card (long press). */
  onCardMove?: (item: KanbanBaseItem, fromColumnId: string) => void
  style?: ViewStyle
  testID?: string
  id?: string
}

function TagBadge({ label, tokens }: { label: string; tokens: DesignTokens }) {
  return (
    <View
      style={{
        backgroundColor: tokens.colors.badgeBackground,
        borderRadius: tokens.radius.sm,
        paddingHorizontal: tokens.spacing[2],
        paddingVertical: 2,
      }}
    >
      <Text
        style={{
          fontSize: tokens.typography.fontSizeXs,
          color: tokens.colors.badgeForeground,
          fontWeight: tokens.typography.fontWeightMedium,
        }}
        numberOfLines={1}
      >
        {label}
      </Text>
    </View>
  )
}

function AssigneeAvatar({
  assignee,
  tokens,
}: {
  assignee: NonNullable<KanbanBaseItem['assignee']>
  tokens: DesignTokens
}) {
  const initials = assignee.name
    .split(' ')
    .map((w) => w[0])
    .join('')
    .slice(0, 2)
    .toUpperCase()

  return (
    <View
      style={{
        width: 24,
        height: 24,
        borderRadius: 12,
        backgroundColor: tokens.colors.secondary,
        alignItems: 'center',
        justifyContent: 'center',
      }}
      accessibilityLabel={`Assigned to ${assignee.name}`}
    >
      <Text
        style={{
          fontSize: 10,
          color: tokens.colors.secondaryForeground,
          fontWeight: tokens.typography.fontWeightBold,
        }}
      >
        {initials}
      </Text>
    </View>
  )
}

interface KanbanCardProps {
  item: KanbanBaseItem
  columnId: string
  tokens: DesignTokens
  onPress: ((item: KanbanBaseItem) => void) | undefined
  onMoveRequest: ((item: KanbanBaseItem, fromColumn: string) => void) | undefined
  testIDPrefix?: string
}

function KanbanCard({
  item,
  columnId,
  tokens,
  onPress,
  onMoveRequest,
  testIDPrefix,
}: KanbanCardProps) {
  const scaleAnim = useRef(new Animated.Value(1)).current

  const handlePress = useCallback(() => {
    onPress?.(item)
  }, [onPress, item])

  const handleLongPress = useCallback(() => {
    Animated.sequence([
      Animated.timing(scaleAnim, { toValue: 1.03, duration: 100, useNativeDriver: true }),
      Animated.timing(scaleAnim, { toValue: 1, duration: 100, useNativeDriver: true }),
    ]).start()

    onMoveRequest?.(item, columnId)
  }, [scaleAnim, onMoveRequest, item, columnId])

  const priorityColor = item.priority ? PRIORITY_COLORS[item.priority] : undefined

  return (
    <Animated.View style={{ transform: [{ scale: scaleAnim }] }}>
      <TouchableOpacity
        onPress={onPress ? handlePress : undefined}
        onLongPress={onMoveRequest ? handleLongPress : undefined}
        delayLongPress={400}
        activeOpacity={0.8}
        accessibilityRole="button"
        accessibilityLabel={`${item.title}${item.priority ? `, priority ${item.priority}` : ''}${item.assignee ? `, assigned to ${item.assignee.name}` : ''}`}
        accessibilityHint={onMoveRequest ? 'Long press to move to another column' : undefined}
        testID={testIDPrefix ? `${testIDPrefix}-card-${item.id}` : undefined}
        style={[
          {
            backgroundColor: tokens.colors.surface,
            borderRadius: tokens.radius.md,
            padding: tokens.spacing[3],
            marginBottom: tokens.spacing[2],
            minHeight: CARD_MIN_HEIGHT,
            ...tokens.shadows.sm,
          },
          priorityColor != null
            ? { borderLeftWidth: PRIORITY_BORDER_WIDTH, borderLeftColor: priorityColor }
            : undefined,
        ]}
      >
        <Text
          style={{
            fontSize: tokens.typography.fontSizeSm,
            color: tokens.colors.text,
            fontWeight: tokens.typography.fontWeightSemibold,
            marginBottom: item.description ? tokens.spacing[1] : 0,
          }}
          numberOfLines={2}
        >
          {item.title}
        </Text>

        {item.description != null ? (
          <Text
            style={{
              fontSize: tokens.typography.fontSizeXs,
              color: tokens.colors.textMuted,
              fontWeight: tokens.typography.fontWeightRegular,
              lineHeight: tokens.typography.fontSizeXs * tokens.typography.lineHeightNormal,
            }}
            numberOfLines={2}
          >
            {item.description}
          </Text>
        ) : null}

        {(item.tags != null && item.tags.length > 0) || item.assignee != null ? (
          <View
            style={{
              flexDirection: 'row',
              flexWrap: 'wrap',
              alignItems: 'center',
              gap: tokens.spacing[1],
              marginTop: tokens.spacing[2],
            }}
          >
            {item.tags?.map((tag) => (
              <TagBadge key={tag} label={tag} tokens={tokens} />
            ))}
            {item.assignee != null ? (
              <View style={{ marginLeft: 'auto' }}>
                <AssigneeAvatar assignee={item.assignee} tokens={tokens} />
              </View>
            ) : null}
          </View>
        ) : null}
      </TouchableOpacity>
    </Animated.View>
  )
}

function ColumnHeader({
  column,
  tokens,
  testIDPrefix,
}: {
  column: KanbanBaseColumn
  tokens: DesignTokens
  testIDPrefix?: string
}) {
  return (
    <View
      style={{
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingBottom: tokens.spacing[3],
        borderTopWidth: 3,
        borderTopColor: column.color ?? tokens.colors.primary,
        paddingTop: tokens.spacing[2],
      }}
      testID={testIDPrefix ? `${testIDPrefix}-column-header-${column.id}` : undefined}
    >
      <Text
        style={{
          fontSize: tokens.typography.fontSizeSm,
          fontWeight: tokens.typography.fontWeightBold,
          color: tokens.colors.text,
        }}
        accessibilityRole="header"
      >
        {column.title}
      </Text>
      <View
        style={{
          backgroundColor: tokens.colors.muted,
          borderRadius: tokens.radius.full,
          paddingHorizontal: tokens.spacing[2],
          paddingVertical: 2,
          minWidth: 24,
          alignItems: 'center',
        }}
      >
        <Text
          style={{
            fontSize: tokens.typography.fontSizeXs,
            color: tokens.colors.mutedForeground,
            fontWeight: tokens.typography.fontWeightSemibold,
          }}
        >
          {column.items.length}
        </Text>
      </View>
    </View>
  )
}

/**
 * Standalone KanbanBoard — plain React props, no manifest required.
 *
 * @example
 * <KanbanBoardBase columns={[{ id: 'todo', title: 'To do', items: [] }]} />
 */
export function KanbanBoardBase({
  columns: initialColumns,
  onCardPress,
  onCardMove,
  style,
  testID,
  id,
}: KanbanBoardBaseProps) {
  const tokens = useTokens()
  const styles = useMemo(() => makeStyles(tokens), [tokens])

  // Sync local state when columns prop changes
  const [columns, setColumns] = useState<KanbanBaseColumn[]>(initialColumns)
  const initialColumnsRef = useRef(initialColumns)
  if (initialColumns !== initialColumnsRef.current) {
    initialColumnsRef.current = initialColumns
    setColumns(initialColumns)
  }

  const handleCardPressInternal = useCallback(
    (item: KanbanBaseItem, columnId: string) => {
      onCardPress?.(item, columnId)
    },
    [onCardPress],
  )

  const handleMoveInternal = useCallback(
    (item: KanbanBaseItem, fromColumnId: string) => {
      onCardMove?.(item, fromColumnId)
    },
    [onCardMove],
  )

  const renderCard = useCallback(
    (column: KanbanBaseColumn) =>
      ({ item }: ListRenderItemInfo<KanbanBaseItem>) => (
        <KanbanCard
          item={item}
          columnId={column.id}
          tokens={tokens}
          onPress={onCardPress ? (i) => handleCardPressInternal(i, column.id) : undefined}
          onMoveRequest={onCardMove ? handleMoveInternal : undefined}
          testIDPrefix={testID}
        />
      ),
    [tokens, onCardPress, onCardMove, testID, handleCardPressInternal, handleMoveInternal],
  )

  const keyExtractor = useCallback((item: KanbanBaseItem) => item.id, [])

  return (
    <ScrollView
      horizontal
      showsHorizontalScrollIndicator={false}
      contentContainerStyle={styles.scrollContent}
      style={style}
      accessibilityRole="scrollbar"
      accessibilityLabel="Kanban board"
      testID={testID ? `${testID}-scroll` : id ? `${id}-scroll` : undefined}
    >
      {columns.map((column) => (
        <View
          key={column.id}
          style={styles.column}
          testID={testID ? `${testID}-column-${column.id}` : undefined}
        >
          <ColumnHeader column={column} tokens={tokens} testIDPrefix={testID} />
          <FlatList<KanbanBaseItem>
            data={column.items}
            renderItem={renderCard(column)}
            keyExtractor={keyExtractor}
            showsVerticalScrollIndicator={false}
            contentContainerStyle={styles.cardList}
          />
        </View>
      ))}
    </ScrollView>
  )
}

function makeStyles(tokens: DesignTokens) {
  return StyleSheet.create({
    scrollContent: {
      paddingHorizontal: tokens.spacing[2],
      gap: tokens.spacing[3],
    },
    column: {
      width: COLUMN_WIDTH,
      backgroundColor: tokens.colors.surfaceAlt,
      borderRadius: tokens.radius.lg,
      padding: tokens.spacing[3],
      maxHeight: '100%',
    },
    cardList: {
      paddingBottom: tokens.spacing[2],
    },
  })
}
