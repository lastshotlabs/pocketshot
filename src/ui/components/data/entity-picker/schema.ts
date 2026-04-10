import { z } from 'zod'
import type { Action } from '../../../actions/types'
const ActionSchema = z.custom<Action>()
const FromRefSchema = z.object({ from: z.string() })

export const EntityPickerSchema = z.object({
  id: z.string(),
  label: z.string().optional(),
  placeholder: z.string().optional().default('Select…'),
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
  searchPlaceholder: z.string().optional().default('Search…'),
  emptyMessage: z.string().optional().default('No results'),
  clearable: z.boolean().optional().default(true),
  onChangeAction: ActionSchema.optional(),
  testID: z.string().optional(),
})
