import type { z } from 'zod'
import type { KanbanBoardSchema } from './schema'

export type KanbanBoardConfig = z.input<typeof KanbanBoardSchema>

export interface KanbanItem {
  id: string
  title: string
  description?: string
  tags?: string[]
  assignee?: { name: string; avatar?: string }
  priority?: 'low' | 'medium' | 'high' | 'urgent'
}

export interface KanbanColumn {
  id: string
  title: string
  color?: string
  items: KanbanItem[]
}
