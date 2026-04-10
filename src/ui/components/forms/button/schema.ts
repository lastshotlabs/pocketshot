import { z } from 'zod'
import type { Action } from '../../../actions/types'

const ActionSchema = z.custom<Action>()
const FromRefSchema = z.object({ from: z.string() })

export const ButtonSchema = z.object({
  id: z.string().optional(),
  label: z.union([z.string(), FromRefSchema]),
  variant: z
    .enum(['primary', 'secondary', 'ghost', 'outline', 'destructive'])
    .optional()
    .default('primary'),
  size: z.enum(['sm', 'md', 'lg']).optional().default('md'),
  loading: z.union([z.boolean(), FromRefSchema]).optional().default(false),
  disabled: z.union([z.boolean(), FromRefSchema]).optional().default(false),
  fullWidth: z.boolean().optional().default(false),
  iconLeft: z.string().optional(),
  iconRight: z.string().optional(),
  onPress: ActionSchema,
  testID: z.string().optional(),
})
