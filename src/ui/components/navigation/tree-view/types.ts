import type { z } from 'zod'
import type { TreeViewSchema } from './schema'

export type TreeViewConfig = z.infer<typeof TreeViewSchema>

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
