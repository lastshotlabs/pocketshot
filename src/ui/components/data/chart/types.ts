import type { z } from 'zod'
import type { ChartSchema } from './schema'

export type ChartConfig = z.infer<typeof ChartSchema>

export interface ChartDataItem {
  label: string
  value: number
  color?: string
}
