import { z } from 'zod'

const ActionSchema = z.custom<import('../../../actions/types').Action>()

const HeaderActionSchema = z.object({
  icon: z.string(),
  label: z.string(),
  action: ActionSchema,
})

export const HeaderSchema = z.object({
  id: z.string().optional(),
  title: z.string(),
  subtitle: z.string().optional(),
  leftAction: HeaderActionSchema.optional(),
  rightAction: HeaderActionSchema.optional(),
  rightActions: z.array(HeaderActionSchema).max(2).optional(),
  showBack: z.boolean().optional().default(false),
  testID: z.string().optional(),
})
