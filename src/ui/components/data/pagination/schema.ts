import { z } from 'zod'
import { extendComponentSchema, slotsSchema } from '../../_base/schema'
import { fromRefSchema as FromRefSchema } from '@lastshotlabs/frontend-contract/refs'
import type { Action } from '../../../actions/types'

const ActionSchema = z.custom<Action>()

export const PaginationSchema = extendComponentSchema({
  id: z.string(),
  mode: z.enum(['pages', 'load-more', 'infinite']),
  totalPages: z.number().optional(),
  currentPage: z.union([z.number(), FromRefSchema]).optional(),
  pageSize: z.number().optional(),
  onPageChange: ActionSchema.optional(),
  onLoadMore: ActionSchema.optional(),
  testID: z.string().optional(),
  slots: slotsSchema([
    'root',
    'container',
    'navButton',
    'pageIndicator',
    'pageText',
    'currentPage',
    'loadMoreButton',
    'loadMoreText',
  ]).optional(),
})
