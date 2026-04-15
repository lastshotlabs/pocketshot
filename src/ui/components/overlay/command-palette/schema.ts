import { z } from 'zod'
import { extendComponentSchema } from '../../_base'
import type { Action } from '../../../actions/types'

const ActionSchema = z.custom<Action>()

export const CommandPaletteSchema = extendComponentSchema({
  id: z.string(),
  placeholder: z.string().optional().default('Type a command...'),
  items: z.array(
    z.object({
      id: z.string(),
      label: z.string(),
      description: z.string().optional(),
      icon: z.string().optional(),
      group: z.string().optional(),
      shortcut: z.string().optional(),
      onSelect: ActionSchema,
    }),
  ),
  maxResults: z.number().optional().default(20),
  testID: z.string().optional(),
})


