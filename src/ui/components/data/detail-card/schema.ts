import { z } from 'zod'
import { extendComponentSchema, slotsSchema } from '../../_base/schema'
import { fromRefSchema as FromRefSchema } from '@lastshotlabs/frontend-contract/refs'
import type { Action } from '../../../actions/types'

const ActionSchema = z.custom<Action>()

export const DetailCardFieldSchema = z.object({
  label: z.string(),
  value: z.union([z.string(), FromRefSchema]),
  type: z.enum(['text', 'badge', 'link', 'date', 'email', 'phone']).optional().default('text'),
  slots: slotsSchema(['field', 'fieldLabel', 'fieldValue']).optional(),
})

export const DetailCardSectionSchema = z.object({
  title: z.string().optional(),
  fields: z.array(DetailCardFieldSchema),
})

export const DetailCardSchema = extendComponentSchema({
  id: z.string().optional(),
  title: z.union([z.string(), FromRefSchema]).optional(),
  subtitle: z.union([z.string(), FromRefSchema]).optional(),
  sections: z.array(DetailCardSectionSchema),
  loading: z.union([z.boolean(), FromRefSchema]).optional(),
  onEditPress: ActionSchema.optional(),
  testID: z.string().optional(),
  slots: slotsSchema([
    'root',
    'panel',
    'header',
    'title',
    'actions',
    'actionButton',
    'fields',
    'field',
    'fieldLabel',
    'fieldValue',
    'loadingState',
  ]).optional(),
})
