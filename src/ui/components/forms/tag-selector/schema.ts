import { z } from 'zod'
import { fromRefSchema as FromRefSchema } from '@lastshotlabs/frontend-contract/refs'
import type { Action } from '../../../actions/types'

const ActionSchema = z.custom<Action>()

export const TagSelectorSchema = z.object({
  id: z.string(),
  label: z.string().optional(),
  availableTags: z.array(
    z.object({
      id: z.string(),
      label: z.string(),
      color: z.string().optional(),
    }),
  ),
  value: z.union([z.array(z.string()), FromRefSchema]).optional(),
  defaultValue: z.array(z.string()).optional(),
  maxTags: z.number().optional(),
  onChangeAction: ActionSchema.optional(),
  testID: z.string().optional(),
})
