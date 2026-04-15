import { z } from 'zod'
import { extendComponentSchema } from '../../_base/schema'
import type { Action } from '../../../actions/types'

const ActionSchema = z.custom<Action>()

const AssigneeSchema = z.object({
  name: z.string(),
  avatar: z.string().optional(),
})

const KanbanItemSchema = z.object({
  id: z.string(),
  title: z.string(),
  description: z.string().optional(),
  tags: z.array(z.string()).optional(),
  assignee: AssigneeSchema.optional(),
  priority: z.enum(['low', 'medium', 'high', 'urgent']).optional(),
})

const KanbanColumnSchema = z.object({
  id: z.string(),
  title: z.string(),
  color: z.string().optional(),
  items: z.array(KanbanItemSchema),
})

export const KanbanBoardSchema = extendComponentSchema({
  id: z.string().optional(),
  columns: z.array(KanbanColumnSchema),
  onItemMove: ActionSchema.optional(),
  onItemPress: ActionSchema.optional(),
  testID: z.string().optional(),
})
