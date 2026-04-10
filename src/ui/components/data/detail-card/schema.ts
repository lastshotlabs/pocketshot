import { z } from 'zod'
import type { Action } from '../../../actions/types'

const ActionSchema = z.custom<Action>()
const FromRefSchema = z.object({ from: z.string() })

export const DetailCardFieldSchema = z.object({
  label: z.string(),
  value: z.union([z.string(), FromRefSchema]),
  type: z
    .enum(['text', 'badge', 'link', 'date', 'email', 'phone'])
    .optional()
    .default('text'),
})

export const DetailCardSectionSchema = z.object({
  title: z.string().optional(),
  fields: z.array(DetailCardFieldSchema),
})

export const DetailCardSchema = z.object({
  id: z.string().optional(),
  title: z.string().optional(),
  subtitle: z.string().optional(),
  sections: z.array(DetailCardSectionSchema),
  loading: z.union([z.boolean(), FromRefSchema]).optional(),
  onEditPress: ActionSchema.optional(),
  testID: z.string().optional(),
})
