import { z } from 'zod'
import { dimensionValueSchema, extendComponentSchema, slotsSchema } from '../../_base/schema'
import type { Action } from '../../../actions/types'

const ActionSchema = z.custom<Action>()

export const RichTextEditorSchema = extendComponentSchema({
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
  minHeight: dimensionValueSchema.optional().default(120),
  maxHeight: dimensionValueSchema.optional().default(400),
  onChangeAction: ActionSchema.optional(),
  slots: slotsSchema([
    'root',
    'toolbar',
    'toolbarContent',
    'toolbarSeparator',
    'toolbarButton',
    'toolbarLabel',
    'input',
    'footer',
    'footerText',
  ]).optional(),
})
