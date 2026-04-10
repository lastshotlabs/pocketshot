import { z } from 'zod'
import type { Action } from '../../../actions/types'

const ActionSchema = z.custom<Action>()

export const RichTextEditorSchema = z.object({
  id: z.string(),
  placeholder: z.string().optional(),
  defaultValue: z.string().optional(),
  toolbar: z
    .array(
      z.enum([
        'heading',
        'bold',
        'italic',
        'underline',
        'list-bullet',
        'list-number',
        'blockquote',
        'code',
        'link',
        'image',
      ]),
    )
    .optional()
    .default(['heading', 'bold', 'italic', 'list-bullet', 'blockquote', 'code']),
  minHeight: z.number().optional().default(120),
  maxHeight: z.number().optional().default(400),
  onChangeAction: ActionSchema.optional(),
  testID: z.string().optional(),
})
