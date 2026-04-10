import type { z } from 'zod'
import type { MarkdownSchema } from './schema'

export type MarkdownConfig = z.infer<typeof MarkdownSchema>

export type MarkdownNodeType =
  | 'paragraph'
  | 'heading'
  | 'bold'
  | 'italic'
  | 'code_inline'
  | 'code_block'
  | 'list_item'
  | 'blockquote'
  | 'text'
  | 'hr'

export interface MarkdownNode {
  type: MarkdownNodeType
  content: string
  level?: number
  ordered?: boolean
  children?: MarkdownNode[]
}
