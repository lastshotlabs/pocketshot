import { z } from 'zod'
import { extendComponentSchema } from '../../_base/schema'
import type { Action } from '../../../actions/types'

const ActionSchema = z.custom<Action>()

const GifResultSchema = z.object({
  id: z.string(),
  url: z.string(),
  preview: z.string().optional(),
  width: z.number().optional(),
  height: z.number().optional(),
})

export const GifPickerSchema = extendComponentSchema({
  id: z.string(),
  onSelect: ActionSchema,
  placeholder: z.string().default('Search GIFs...'),
  provider: z.enum(['giphy', 'tenor']).optional(),
  apiEndpoint: z.string().optional(),
  /** Static GIF data to display without needing an API endpoint */
  sampleGifs: z.array(GifResultSchema).optional(),
  testID: z.string().optional(),
})
