import { z } from 'zod'

const ActionSchema = z.custom<import('../../../actions/types').Action>()

const FromRefSchema = z.object({ from: z.string() })

export const RatingInputSchema = z.object({
  id: z.string(),
  label: z.string().optional(),
  maxStars: z.number().optional().default(5),
  defaultValue: z.number().optional(),
  value: z.union([z.number(), FromRefSchema]).optional(),
  size: z.enum(['sm', 'md', 'lg']).optional().default('md'),
  allowHalf: z.boolean().optional().default(false),
  readOnly: z.boolean().optional().default(false),
  onChangeAction: ActionSchema.optional(),
  testID: z.string().optional(),
})
