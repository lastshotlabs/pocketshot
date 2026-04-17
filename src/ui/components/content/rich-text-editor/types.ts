import type { z } from 'zod'
import type { RichTextEditorSchema } from './schema'

export type RichTextEditorConfig = z.input<typeof RichTextEditorSchema>

export type EditorToolbarItem =
  | 'heading'
  | 'bold'
  | 'italic'
  | 'underline'
  | 'list-bullet'
  | 'list-number'
  | 'blockquote'
  | 'code'
  | 'link'
  | 'image'
