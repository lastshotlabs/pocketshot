import { z } from 'zod'
import { fromRefSchema as FromRefSchema } from '@lastshotlabs/frontend-contract/refs'
import { extendComponentSchema, slotsSchema } from '../../_base/schema'

const TimelineItemSchema = z.object({
  id: z.string(),
  title: z.string(),
  description: z.string().optional(),
  timestamp: z.string().optional(),
  icon: z.string().optional(),
  color: z.string().optional(),
  slots: slotsSchema([
    'item',
    'markerColumn',
    'marker',
    'connector',
    'body',
    'header',
    'titleGroup',
    'itemIcon',
    'title',
    'description',
    'meta',
    'content',
  ]).optional(),
})

export const TimelineSchema = extendComponentSchema({
  id: z.string().optional(),
  data: z.union([z.string(), FromRefSchema]).optional(),
  items: z.array(TimelineItemSchema).optional(),
  testID: z.string().optional(),
  slots: slotsSchema([
    'root',
    'loadingState',
    'item',
    'markerColumn',
    'marker',
    'connector',
    'body',
    'header',
    'titleGroup',
    'itemIcon',
    'title',
    'description',
    'meta',
    'content',
  ]).optional(),
})
