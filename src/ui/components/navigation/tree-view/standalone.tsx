import React, { useCallback, useMemo, useState } from 'react'
import {
  FlatList,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
  type ViewStyle,
} from 'react-native'
import { useTokens } from '../../../context/AppContext'
import type { DesignTokens } from '../../../tokens/types'

export interface TreeNode {
  id: string
  label: string
  icon?: string
  badge?: string
  children?: TreeNode[]
}

export interface FlatTreeItem {
  node: TreeNode
  depth: number
  hasChildren: boolean
  isExpanded: boolean
  isLast: boolean
  parentIds: string[]
}

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
    leafSpacer: { width: tokens.spacing[5] + tokens.spacing[1] },
    icon: { fontSize: tokens.typography.fontSizeMd, marginRight: tokens.spacing[2] },
    label: { flex: 1, fontSize: tokens.typography.fontSizeMd, color: tokens.colors.text },
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

export interface TreeViewBaseProps {
  data: TreeNode[]
  defaultExpandedIds?: string[]
  showConnectors?: boolean
  onItemPress?: (node: TreeNode) => void
  onItemLongPress?: (node: TreeNode) => void
  style?: ViewStyle
  testID?: string
  id?: string
}

/**
 * Standalone TreeView — plain React props, no manifest required.
 *
 * @example
 * <TreeViewBase
 *   data={[{ id: 'root', label: 'Root', children: [{ id: 'a', label: 'A' }] }]}
 *   onItemPress={(n) => console.log(n.id)}
 * />
 */
export function TreeViewBase({
  data,
  defaultExpandedIds,
  showConnectors = true,
  onItemPress,
  onItemLongPress,
  style,
  testID,
  id,
}: TreeViewBaseProps) {
  const tokens = useTokens()
  const styles = useMemo(() => makeStyles(tokens), [tokens])
  const [expandedIds, setExpandedIds] = useState<Set<string>>(
    () => new Set(defaultExpandedIds ?? []),
  )
  const flatData = useMemo(() => flattenTree(data, expandedIds), [data, expandedIds])

  const handleToggle = useCallback((nodeId: string) => {
    setExpandedIds((prev) => {
      const next = new Set(prev)
      if (next.has(nodeId)) next.delete(nodeId)
      else next.add(nodeId)
      return next
    })
  }, [])

  const renderItem = useCallback(
    ({ item }: { item: FlatTreeItem }) => {
      const { node, depth, hasChildren, isExpanded, isLast } = item
      const indentWidth = depth * tokens.spacing[5]
      const itemTestID = testID ? `${testID}-item-${node.id}` : `tree-item-${node.id}`

      return (
        <TouchableOpacity
          style={styles.row}
          onPress={() => onItemPress?.(node)}
          onLongPress={() => onItemLongPress?.(node)}
          accessibilityRole="menuitem"
          accessibilityState={{ expanded: hasChildren ? isExpanded : undefined }}
          accessibilityLabel={node.label}
          testID={itemTestID}
          activeOpacity={0.7}
        >
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
                        i === depth - 1 && isLast ? { bottom: '50%' } : undefined,
                      ]}
                    />
                    {i === depth - 1 && (
                      <View
                        style={[
                          styles.connectorHorizontal,
                          {
                            position: 'absolute',
                            left: tokens.spacing[5] / 2,
                            top: '50%',
                          },
                        ]}
                      />
                    )}
                  </View>
                ))}
            </View>
          )}
          {hasChildren ? (
            <TouchableOpacity
              style={styles.toggleButton}
              onPress={() => handleToggle(node.id)}
              accessibilityRole="button"
              accessibilityLabel={isExpanded ? `Collapse ${node.label}` : `Expand ${node.label}`}
              testID={`${itemTestID}-toggle`}
              hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
            >
              <Text style={styles.toggleText}>{isExpanded ? '▼' : '▶'}</Text>
            </TouchableOpacity>
          ) : (
            <View style={styles.leafSpacer} />
          )}
          {node.icon != null && (
            <Text style={styles.icon} accessibilityElementsHidden>
              {node.icon}
            </Text>
          )}
          <Text style={styles.label} numberOfLines={1}>
            {node.label}
          </Text>
          {node.badge != null && <Text style={styles.badge}>{node.badge}</Text>}
        </TouchableOpacity>
      )
    },
    [tokens, styles, showConnectors, onItemPress, onItemLongPress, handleToggle, testID],
  )

  const keyExtractor = useCallback((item: FlatTreeItem) => item.node.id, [])

  return (
    <FlatList
      style={style}
      data={flatData}
      renderItem={renderItem}
      keyExtractor={keyExtractor}
      scrollEnabled={false}
      removeClippedSubviews={false}
      accessibilityRole="menu"
      testID={testID ? `${testID}-list` : id ? `${id}-list` : undefined}
    />
  )
}
