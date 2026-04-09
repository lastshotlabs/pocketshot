import type { z } from 'zod'
import type { StatusBadgeSchema } from './schema'

export type StatusBadgeConfig = z.infer<typeof StatusBadgeSchema>
export type StatusColor = 'primary' | 'success' | 'warning' | 'error' | 'info' | 'default'

export interface ResolvedStatus {
  label: string
  color: StatusColor
}
