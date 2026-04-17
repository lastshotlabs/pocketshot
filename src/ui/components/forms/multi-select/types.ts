import type { z } from 'zod'
import type { MultiSelectSchema } from './schema'

export type MultiSelectConfig = z.input<typeof MultiSelectSchema>

export interface SelectOption {
  value: string
  label: string
}
