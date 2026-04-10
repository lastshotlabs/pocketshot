import type { z } from 'zod'
import type { TagSelectorSchema } from './schema'

export type TagSelectorConfig = z.infer<typeof TagSelectorSchema>

export interface TagDefinition {
  id: string
  label: string
  color?: string
}
