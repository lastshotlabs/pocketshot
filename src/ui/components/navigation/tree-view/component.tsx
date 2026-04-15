import React, { useCallback, useMemo, useState } from 'react'
import {
  FlatList,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native'
import { ComponentWrapper } from '../../_base/ComponentWrapper'
import { useTokens } from '../../../context/AppContext'
import { useScreenContext } from '../../../context/ScreenContext'
import { resolveFromRef, isFromRef } from '../../_base/fromRef'
import type { DesignTokens } from '../../../tokens/types'
import type { TreeViewConfig, TreeNode, FlatTreeItem } from './types'

function flattenTree(
  nodes: TreeNode[],
  expandedIds: Set<string>,
  depth = 0,
  parentIds: string[] = [],
): FlatTreeItem[] {
  const result: FlatTreeItem[] = []
  for (let i = 0; i < nodes.length; i++) {
    const node = nodes[i]
    const hasChildren = Array.isArray(node.children) && node.children.length > 0
    const isExpanded = expandedIds.has(node.id)
    const isLast = i === nodes.length - 1
    result.push({ node, depth, hasChildren, isExpanded, isLast, parentIds })
    if (hasChildren && isExpanded) {
      result.push(
        ...flattenTree(node.children!, expandedIds, depth + 1, [...parentIds, node.id]),
      )
    }
  }
  return result
}

function makeStyles(tokens: DesignTokens) {
  return StyleSheet.create({
    row: {
      flexDirection: 'row',
      alignItems: 'center',
      paddingVertical: tokens.spacing[2],
      paddingRight: tokens.spacing[4],
      backgroundColor: tokens.colors.surface,
    },
    indentBlock: {
      flexDirection: 'row',
      alignItems: 'stretch',
    },
    connectorVertical: {
      width: StyleSheet.hairlineWidth,
      backgroundColor: tokens.colors.border,
      position: 'absolute',
      top: 0,
      bottom: 0,
      left: tokens.spacing[5] / 2,
    },
    connectorHorizontal: {
      width: tokens.spacing[3],
      height: StyleSheet.hairlineWidth,
      backgroundColor: tokens.colors.border,
      alignSelf: 'center',
    },
    toggleButton: {
      width: tokens.spacing[5],
      height: tokens.spacing[5],
      alignItems: 'center',
      justifyContent: 'center',
      marginRight: tokens.spacing[1],
    },
    toggleText: {
      fontSize: tokens.typography.fontSizeXs,
      color: tokens.colors.textMuted,
    },
    leafSpacer: {
      width: tokens.spacing[5] + tokens.spacing[1],
    },
    icon: {
      fontSize: tokens.typography.fontSizeMd,
      marginRight: tokens.spacing[2],
    },
    label: {
      flex: 1,
      fontSize: tokens.typography.fontSizeMd,
      color: tokens.colors.text,
    },
    badge: {
      fontSize: tokens.typography.fontSizeXs,
      fontWeight: tokens.typography.fontWeightSemibold,
      color: tokens.colors.badgeForeground,
      backgroundColor: tokens.colors.badgeBackground,
      paddingHorizontal: tokens.spacing[2],
      paddingVertical: 2,
      borderRadius: tokens.radius.full,
      overflow: 'hidden',
      marginLeft: tokens.spacing[2],
    },
  })
}

interface TreeRowProps {
  item: FlatTreeItem
  showConnectors: boolean
  styles: ReturnType<typeof makeStyles>
  tokens: DesignTokens
  onToggle: (id: string) => void
  onPress: (item: FlatTreeItem) => void
  onLongPress: (item: FlatTreeItem) => void
  testIDPrefix?: string
}

function TreeRow({
  item,
  showConnectors,
  styles,
  tokens,
  onToggle,
  onPress,
  onLongPress,
  testIDPrefix,
}: TreeRowProps) {
  const { node, depth, hasChildren, isExpanded, isLast } = item
  const indentWidth = depth * tokens.spacing[5]
  const testID = testIDPrefix
    ? `${testIDPrefix}-item-${node.id}`
    : `tree-item-${node.id}`

  return (
    <TouchableOpacity
      style={styles.row}
      onPress={() => onPress(item)}
      onLongPress={() => onLongPress(item)}
      accessibilityRole="menuitem"
      accessibilityState={{ expanded: hasChildren ? isExpanded : undefined }}
      accessibilityLabel={node.label}
      testID={testID}
      activeOpacity={0.7}
    >
      {/* Indentation + connectors */}
      {depth > 0 && (
        <View style={{ width: indentWidth, flexDirection: 'row' }}>
          {showConnectors &&
            Array.from({ length: depth }).map((_, i) => (
              <View
                key={i}
                style={{
                  width: tokens.spacing[5],
                  position: 'relative',
                  alignItems: 'center',
                }}
              >
                <View
                  style={[
                    styles.connectorVertical,
                    // Last segment: only draw down to center if this is the last sibling
                    i === depth - 1 && isLast
                      ? { bottom: '50%' }
                      : undefined,
                  ]}
                />
                {i === depth - 1 && (
                  <View
                    style={[
                      styles.connectorHorizontal,
                      { position: 'absolute', left: tokens.spacing[5] / 2, top: '50%' },
                    ]}
                  />
                )}
              </View>
            ))}
        </View>
      )}

      {/* Expand/collapse toggle */}
      {hasChildren ? (
        <TouchableOpacity
          style={styles.toggleButton}
          onPress={() => onToggle(node.id)}
          accessibilityRole="button"
          accessibilityLabel={isExpanded ? `Collapse ${node.label}` : `Expand ${node.label}`}
          testID={`${testID}-toggle`}
          hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
        >
          <Text style={styles.toggleText}>{isExpanded ? '▼' : '▶'}</Text>
        </TouchableOpacity>
      ) : (
        <View style={styles.leafSpacer} />
      )}

      {/* Icon */}
      {node.icon != null && (
        <Text style={styles.icon} accessibilityElementsHidden>
          {node.icon}
        </Text>
      )}

      {/* Label */}
      <Text style={styles.label} numberOfLines={1}>
        {node.label}
      </Text>

      {/* Badge */}
      {node.badge != null && (
        <Text style={styles.badge}>{node.badge}</Text>
      )}
    </TouchableOpacity>
  )
}

/**
 * Config-driven hierarchical tree view. Renders a flat virtualized list of
 * nodes that can be expanded/collapsed. Supports connectors, icons, badges,
 * and press/long-press actions.
 *
 * Publishes pressed node id to ScreenContext under `__pressedTreeItem` and
 * `__longPressedTreeItem` before dispatching configured actions.
 */
export function TreeView({ config }: { config: TreeViewConfig }) {
  const tokens = useTokens()
  const { setValue, dispatch, values } = useScreenContext()

  const resolvedData = useMemo<TreeNode[]>(() => {
    if (isFromRef(config.data)) {
      return ((resolveFromRef(config.data as { from: string }, values) as unknown) as TreeNode[]) ?? []
    }
    return config.data as TreeNode[]
  }, [config.data, values])

  const [expandedIds, setExpandedIds] = useState<Set<string>>(
    () => new Set(config.defaultExpandedIds ?? []),
  )

  const showConnectors = config.showConnectors ?? true
  const styles = useMemo(() => makeStyles(tokens), [tokens])

  const flatData = useMemo(
    () => flattenTree(resolvedData, expandedIds),
    [resolvedData, expandedIds],
  )

  const handleToggle = useCallback((nodeId: string) => {
    setExpandedIds((prev) => {
      const next = new Set(prev)
      if (next.has(nodeId)) {
        next.delete(nodeId)
      } else {
        next.add(nodeId)
      }
      return next
    })
  }, [])

  const handlePress = useCallback(
    (item: FlatTreeItem) => {
      setValue('__pressedTreeItem', item.node.id)
      if (config.onItemPress) {
        void dispatch(config.onItemPress)
      }
    },
    [setValue, dispatch, config.onItemPress],
  )

  const handleLongPress = useCallback(
    (item: FlatTreeItem) => {
      setValue('__longPressedTreeItem', item.node.id)
      if (config.onItemLongPress) {
        void dispatch(config.onItemLongPress)
      }
    },
    [setValue, dispatch, config.onItemLongPress],
  )

  const renderItem = useCallback(
    ({ item }: { item: FlatTreeItem }) => (
      <TreeRow
        item={item}
        showConnectors={showConnectors}
        styles={styles}
        tokens={tokens}
        onToggle={handleToggle}
        onPress={handlePress}
        onLongPress={handleLongPress}
        testIDPrefix={config.testID ?? config.id}
      />
    ),
    [showConnectors, styles, tokens, handleToggle, handlePress, handleLongPress, config.testID, config.id],
  )

  const keyExtractor = useCallback((item: FlatTreeItem) => item.node.id, [])

  return (
    <ComponentWrapper id={config.id} testID={config.testID} config={config}>
      <FlatList
        data={flatData}
        renderItem={renderItem}
        keyExtractor={keyExtractor}
        scrollEnabled={false}
        removeClippedSubviews={false}
        accessibilityRole="menu"
        testID={config.testID ? `${config.testID}-list` : config.id ? `${config.id}-list` : undefined}
      />
    </ComponentWrapper>
  )
}

