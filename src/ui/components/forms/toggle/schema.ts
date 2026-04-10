import { z } from 'zod'
import type { Action } from '../../../actions/types'

const ActionSchema = z.custom<Action>()
const FromRefSchema = z.object({ from: z.string() })

export const ToggleSchema = z.object({
  id: z.string(),
  label: z.union([z.string(), FromRefSchema]).optional(),
  icon: z.string().optional(),
  value: z.union([z.boolean(), FromRefSchema]).optional(),
  defaultValue: z.boolean().optional().default(false),
  variant: z.enum(['default', 'primary', 'outline']).optional().default('default'),
  size: z.enum(['sm', 'md', 'lg']).optional().default('md'),
  disabled: z.union([z.boolean(), FromRefSchema]).optional(),
  onChangeAction: ActionSchema.optional(),
  testID: z.string().optional(),
})
