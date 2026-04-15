import { z } from 'zod'
import { extendComponentSchema } from '../../_base'
import { fromRefSchema as FromRefSchema } from '@lastshotlabs/frontend-contract/refs'
import type { Action } from '../../../actions/types'

const ActionSchema = z.custom<Action>()

export const DetailCardFieldSchema = extendComponentSchema({
  label: z.string(),
  value: z.union([z.string(), FromRefSchema]),
  type: z
    .enum(['text', 'badge', 'link', 'date', 'email', 'phone'])
    .optional()
    .default('text'),
})

export const DetailCardSectionSchema = extendComponentSchema({
  title: z.string().optional(),
  fields: z.array(DetailCardFieldSchema),
})

export const DetailCardSchema = extendComponentSchema({
  id: z.string().optional(),
  title: z.string().optional(),
  subtitle: z.string().optional(),
  sections: z.array(DetailCardSectionSchema),
  loading: z.union([z.boolean(), FromRefSchema]).optional(),
  onEditPress: ActionSchema.optional(),
  testID: z.string().optional(),
})


