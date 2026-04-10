import React, { useCallback, useMemo, useRef, useState } from 'react'
import {
  View,
  Text,
  ScrollView,
  FlatList,
  TouchableOpacity,
  Animated,
  StyleSheet,
  type ListRenderItemInfo,
} from 'react-native'
import { ComponentWrapper } from '../../_base/ComponentWrapper'
import { useTokens } from '../../../context/AppContext'
import { useScreenContext } from '../../../context/ScreenContext'
import type { DesignTokens } from '../../../tokens/types'
import type { KanbanBoardConfig, KanbanColumn, KanbanItem } from './types'

const COLUMN_WIDTH = 280
const CARD_MIN_HEIGHT = 80
const PRIORITY_BORDER_WIDTH = 3

const PRIORITY_COLORS: Record<string, string> = {
  low: '#22c55e',
  medium: '#eab308',
  high: '#f97316',
  urgent: '#ef4444',
}

// ---------------------------------------------------------------------------
// Tag badge
// ---------------------------------------------------------------------------

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

// ---------------------------------------------------------------------------
// Assignee avatar
// ---------------------------------------------------------------------------

function AssigneeAvatar({
  assignee,
  tokens,
}: {
  assignee: NonNullable<KanbanItem['assignee']>
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

// ---------------------------------------------------------------------------
// Kanban card
// ---------------------------------------------------------------------------

interface KanbanCardProps {
  item: KanbanItem
  columnId: string
  columns: KanbanColumn[]
  tokens: DesignTokens
  onPress: ((item: KanbanItem) => void) | undefined
  onMoveRequest: ((item: KanbanItem, fromColumn: string) => void) | undefined
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
    // Haptic-like visual feedback: scale up briefly
    Animated.sequence([
      Animated.timing(scaleAnim, {
        toValue: 1.03,
        duration: 100,
        useNativeDriver: true,
      }),
      Animated.timing(scaleAnim, {
        toValue: 1,
        duration: 100,
        useNativeDriver: true,
      }),
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
            {item.tags?.map((tag) => <TagBadge key={tag} label={tag} tokens={tokens} />)}
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

// ---------------------------------------------------------------------------
// Column header
// ---------------------------------------------------------------------------

function ColumnHeader({
  column,
  tokens,
  testIDPrefix,
}: {
  column: KanbanColumn
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

// ---------------------------------------------------------------------------
// KanbanBoard
// ---------------------------------------------------------------------------

export function KanbanBoard({ config }: { config: KanbanBoardConfig }) {
  const tokens = useTokens()
  const { dispatch } = useScreenContext()
  const [columns, setColumns] = useState<KanbanColumn[]>(config.columns as KanbanColumn[])

  // Update columns if config changes (from-ref or parent re-render)
  const configColumnsRef = useRef(config.columns)
  if (config.columns !== configColumnsRef.current) {
    configColumnsRef.current = config.columns
    setColumns(config.columns as KanbanColumn[])
  }

  const handleItemPress = useCallback(
    async (item: KanbanItem) => {
      if (config.onItemPress) {
        await dispatch({
          ...config.onItemPress,
          // Attach item data for the action handler via set-value pattern
        } as typeof config.onItemPress)
      }
    },
    [config.onItemPress, dispatch],
  )

  const handleMoveRequest = useCallback(
    async (item: KanbanItem, fromColumnId: string) => {
      if (!config.onItemMove) return

      // Build column options for action-sheet (excluding current column)
      const otherColumns = columns.filter((c) => c.id !== fromColumnId)
      if (otherColumns.length === 0) return

      await dispatch({
        type: 'action-sheet',
        title: `Move "${item.title}" to...`,
        options: otherColumns.map((col) => ({
          label: col.title,
          action: {
            type: 'set-value',
            key: '__kanban_move',
            value: {
              itemId: item.id,
              fromColumn: fromColumnId,
              toColumn: col.id,
              position: 0,
            },
          },
        })),
      })

      // After the action-sheet dispatches the set-value, also fire the onItemMove
      // action. The consumer can read __kanban_move from screen context.
      await dispatch(config.onItemMove)
    },
    [config.onItemMove, columns, dispatch],
  )

  const styles = useMemo(() => makeStyles(tokens), [tokens])

  const renderCard = useCallback(
    (column: KanbanColumn) =>
      ({ item }: ListRenderItemInfo<KanbanItem>) => (
        <KanbanCard
          item={item}
          columnId={column.id}
          columns={columns}
          tokens={tokens}
          onPress={config.onItemPress ? handleItemPress : undefined}
          onMoveRequest={config.onItemMove ? handleMoveRequest : undefined}
          testIDPrefix={config.testID}
        />
      ),
    [columns, tokens, config.onItemPress, config.onItemMove, config.testID, handleItemPress, handleMoveRequest],
  )

  const keyExtractor = useCallback((item: KanbanItem) => item.id, [])

  return (
    <ComponentWrapper id={config.id} testID={config.testID}>
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
        accessibilityRole="scrollbar"
        accessibilityLabel="Kanban board"
        testID={config.testID ? `${config.testID}-scroll` : undefined}
      >
        {columns.map((column) => (
          <View
            key={column.id}
            style={styles.column}
            testID={config.testID ? `${config.testID}-column-${column.id}` : undefined}
          >
            <ColumnHeader column={column} tokens={tokens} testIDPrefix={config.testID} />
            <FlatList<KanbanItem>
              data={column.items}
              renderItem={renderCard(column)}
              keyExtractor={keyExtractor}
              showsVerticalScrollIndicator={false}
              contentContainerStyle={styles.cardList}
            />
          </View>
        ))}
      </ScrollView>
    </ComponentWrapper>
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
