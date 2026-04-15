import { z } from 'zod'
import { fromRefSchema as FromRefSchema } from '@lastshotlabs/frontend-contract/refs'
import type { Action } from '../../../actions/types'
import { extendComponentSchema } from '../../_base/schema'

const ActionSchema = z.custom<Action>()

export const ButtonSchema = extendComponentSchema({
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
})
