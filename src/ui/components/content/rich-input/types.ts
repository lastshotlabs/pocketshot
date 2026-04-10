import type { z } from 'zod'
import type { RichInputSchema } from './schema'

export type RichInputConfig = z.infer<typeof RichInputSchema>

export type ToolbarItem =
  | 'bold'
  | 'italic'
  | 'underline'
  | 'strikethrough'
  | 'code'
  | 'list-bullet'
  | 'list-number'
  | 'link'
  | 'quote'
