import { z } from 'zod'
import { extendComponentSchema, slotsSchema } from '../../_base/schema'
import { fromRefSchema as FromRefSchema } from '@lastshotlabs/frontend-contract/refs'

export const RichTextViewerSchema = extendComponentSchema({
  id: z.string().optional(),
  content: z.union([z.string(), FromRefSchema]),
  maxLines: z.number().optional(),
  showExpandButton: z.boolean().optional().default(true),
  testID: z.string().optional(),
  slots: slotsSchema([
    'root',
    'container',
    'text',
    'heading',
    'paragraph',
    'list',
    'bullet',
    'listItem',
    'blockquote',
    'code',
    'link',
    'expandButton',
    'expandText',
  ]).optional(),
})
