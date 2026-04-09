import type { z } from 'zod'
import type { SelectSchema } from './schema'

export type SelectConfig = z.input<typeof SelectSchema>

export interface SelectOption {
  label: string
  value: string
}
