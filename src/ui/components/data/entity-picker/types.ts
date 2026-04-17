import type { z } from 'zod'
import type { EntityPickerSchema } from './schema'

export type EntityPickerConfig = z.input<typeof EntityPickerSchema>

export interface EntityOption {
  value: string
  label: string
  subtitle?: string
  avatarUrl?: string
}
