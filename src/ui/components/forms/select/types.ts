import type { z } from 'zod'
import type { SelectSchema } from './schema'

export type SelectConfig = z.infer<typeof SelectSchema>

export interface SelectOption {
  label: string
  value: string
}
