import { z } from 'zod'
import { extendComponentSchema, looseSlots } from '../../_base/schema'
import { fromRefSchema as FromRefSchema } from '@lastshotlabs/frontend-contract/refs'
import type { Action } from '../../../actions/types'

const ActionSchema = z.custom<Action>()

export const EntityPickerSchema = extendComponentSchema({
  id: z.string(),
  label: z.string().optional(),
  placeholder: z.string().optional().default('Select...'),
  data: z.union([
    z.array(
      z.object({
        value: z.string(),
        label: z.string(),
        subtitle: z.string().optional(),
        avatarUrl: z.string().optional(),
      }),
    ),
    FromRefSchema,
  ]),
  value: z.union([z.string(), FromRefSchema]).optional(),
  defaultValue: z.string().optional(),
  searchable: z.boolean().optional().default(true),
  searchPlaceholder: z.string().optional().default('Search...'),
  emptyMessage: z.string().optional().default('No results'),
  clearable: z.boolean().optional().default(true),
  onChangeAction: ActionSchema.optional(),
  testID: z.string().optional(),
  slots: looseSlots([
    'root',
    'label',
    'trigger',
    'triggerText',
    'triggerPlaceholder',
    'triggerChevron',
    'selectedAvatar',
    'selectedAvatarImage',
    'selectedAvatarInitials',
    'clearButton',
    'clearButtonText',
    'backdrop',
    'panel',
    'dragHandle',
    'searchContainer',
    'searchInput',
    'entityRow',
    'entityAvatar',
    'entityAvatarImage',
    'entityAvatarInitials',
    'entityInfo',
    'entityLabel',
    'entitySubtitle',
    'checkmark',
    'separator',
    'emptyState',
    'emptyText',
  ]).optional(),
})
