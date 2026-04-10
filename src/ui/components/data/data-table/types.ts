import type { z } from 'zod'
import type { DataTableSchema } from './schema'

export type DataTableConfig = z.infer<typeof DataTableSchema>

export interface TableColumn {
  key: string
  label: string
  sortable?: boolean
  width?: number
  flex?: number
  align?: 'left' | 'center' | 'right'
}
