import React, { useCallback, useMemo } from 'react'
import { ComponentWrapper } from '../../_base/ComponentWrapper'
import { useScreenContext } from '../../../context/ScreenContext'
import { resolveFromRef, isFromRef } from '../../_base/fromRef'
import { TreeViewBase, type TreeNode } from './standalone'
import type { TreeViewConfig } from './types'

/**
 * Config-driven hierarchical tree view.
 */
export function TreeView({ config }: { config: TreeViewConfig }) {
  const { setValue, dispatch, values } = useScreenContext()

  const resolvedData = useMemo<TreeNode[]>(() => {
    if (isFromRef(config.data)) {
      return ((resolveFromRef(config.data as { from: string }, values) as unknown) as TreeNode[]) ?? []
    }
    return config.data as TreeNode[]
  }, [config.data, values])

  const handlePress = useCallback(
    (node: TreeNode) => {
      setValue('__pressedTreeItem', node.id)
      if (config.onItemPress) void dispatch(config.onItemPress)
    },
    [setValue, dispatch, config.onItemPress],
  )

  const handleLongPress = useCallback(
    (node: TreeNode) => {
      setValue('__longPressedTreeItem', node.id)
      if (config.onItemLongPress) void dispatch(config.onItemLongPress)
    },
    [setValue, dispatch, config.onItemLongPress],
  )

  return (
    <ComponentWrapper id={config.id} testID={config.testID} config={config}>
      <TreeViewBase
        id={config.id}
        testID={config.testID}
        data={resolvedData}
        defaultExpandedIds={config.defaultExpandedIds}
        showConnectors={config.showConnectors ?? true}
        onItemPress={handlePress}
        onItemLongPress={handleLongPress}
      />
    </ComponentWrapper>
  )
}
