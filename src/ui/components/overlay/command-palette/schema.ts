import { z } from 'zod'
import { extendComponentSchema, looseSlots } from '../../_base/schema'
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
  slots: looseSlots([
    'root',
    'backdrop',
    'container',
    'panel',
    'searchContainer',
    'searchIcon',
    'searchInput',
    'clearButton',
    'clearText',
    'groupHeader',
    'groupLabel',
    'itemRow',
    'itemIcon',
    'itemContent',
    'itemLabel',
    'itemDescription',
    'itemShortcut',
    'emptyContainer',
    'emptyText',
    'separator',
  ]).optional(),
})
