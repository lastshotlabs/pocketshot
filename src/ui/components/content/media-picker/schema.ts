import { z } from 'zod'
import { extendComponentSchema, slotsSchema } from '../../_base/schema'
import type { Action } from '../../../actions/types'

const ActionSchema = z.custom<Action>()

export const MediaPickerSchema = extendComponentSchema({
  id: z.string(),
  mediaTypes: z.array(z.enum(['image', 'video', 'document'])).default(['image']),
  maxSelections: z.number().optional().default(1),
  quality: z.number().min(0).max(1).optional().default(0.8),
  onSelect: ActionSchema,
  testID: z.string().optional(),
  slots: slotsSchema([
    'root',
    'pickButton',
    'pickIcon',
    'pickLabel',
    'pickSubtitle',
    'previewScroll',
    'previewContent',
    'previewItem',
    'thumbnail',
    'filePlaceholder',
    'filePlaceholderIcon',
    'removeButton',
    'removeText',
    'itemName',
  ]).optional(),
})
