import { z } from 'zod'
import { extendComponentSchema, slotsSchema } from '../../_base/schema'

export const ActionSheetSchema = extendComponentSchema({
  id: z.string().optional(),
  slots: slotsSchema([
    'root',
    'backdrop',
    'container',
    'title',
    'divider',
    'option',
    'optionText',
    'cancelSeparator',
    'cancelOption',
    'cancelText',
  ]).optional(),
})
