import type { z } from 'zod'
import type { RichTextViewerSchema } from './schema'

export type RichTextViewerConfig = z.infer<typeof RichTextViewerSchema>

export type RichTextNodeType =
  | 'text'
  | 'bold'
  | 'italic'
  | 'underline'
  | 'link'
  | 'heading'
  | 'paragraph'
  | 'unordered-list'
  | 'ordered-list'
  | 'list-item'
  | 'blockquote'
  | 'code'

export interface RichTextNode {
  type: RichTextNodeType
  content?: string
  children?: RichTextNode[]
  level?: number
  href?: string
  index?: number
}
