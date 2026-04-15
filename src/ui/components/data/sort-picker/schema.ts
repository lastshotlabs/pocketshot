import { z } from 'zod'
import { extendComponentSchema } from '../../_base'
import type { Action } from '../../../actions/types'

const ActionSchema = z.custom<Action>()

export const SortPickerSchema = extendComponentSchema({
  id: z.string(),
  options: z.array(
    z.object({
      value: z.string(),
      label: z.string(),
      icon: z.string().optional(),
    }),
  ),
  defaultValue: z.string().optional(),
  onSelect: ActionSchema,
  testID: z.string().optional(),
})


