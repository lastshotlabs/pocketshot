
import { extendComponentSchema } from '../../_base'
import { fromRefSchema as FromRefSchema } from '@lastshotlabs/frontend-contract/refs'
import type { Action } from '../../../actions/types'
import type { TreeNode } from './types'

const ActionSchema = z.custom<Action>()

const TreeNodeSchema: z.ZodType<TreeNode> = z.lazy(() =>
  z.object({
    id: z.string(),
    label: z.string(),
    icon: z.string().optional(),
    badge: z.string().optional(),
    children: z.array(TreeNodeSchema).optional(),
  }),
)

export const TreeViewSchema = extendComponentSchema({
  id: z.string().optional(),
  data: z.union([z.array(TreeNodeSchema), FromRefSchema]),
  defaultExpandedIds: z.array(z.string()).optional(),
  onItemPress: ActionSchema.optional(),
  onItemLongPress: ActionSchema.optional(),
  showConnectors: z.boolean().optional().default(true),
  testID: z.string().optional(),
})

export { TreeNodeSchema }

