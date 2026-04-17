import type { z } from 'zod'
import type { TagSelectorSchema } from './schema'

export type TagSelectorConfig = z.input<typeof TagSelectorSchema>

export interface TagDefinition {
  id: string
  label: string
  color?: string
}
