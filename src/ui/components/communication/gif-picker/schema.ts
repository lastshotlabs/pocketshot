import { z } from 'zod'
import type { Action } from '../../../actions/types'

const ActionSchema = z.custom<Action>()

export const GifPickerSchema = z.object({
  id: z.string(),
  onSelect: ActionSchema,
  placeholder: z.string().default('Search GIFs...'),
  provider: z.enum(['giphy', 'tenor']).optional(),
  apiEndpoint: z.string().optional(),
  testID: z.string().optional(),
})
