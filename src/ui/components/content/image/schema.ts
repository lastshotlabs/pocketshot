import { z } from 'zod'
import { extendComponentSchema } from '../../_base/schema'
import { fromRefSchema as FromRefSchema } from '@lastshotlabs/frontend-contract/refs'
import type { Action } from '../../../actions/types'

const ActionSchema = z.custom<Action>()

export const ImageSchema = extendComponentSchema({
  src: z.union([z.string(), FromRefSchema]),
  alt: z.string(),
  aspectRatio: z.number().optional(),
  resizeMode: z.enum(['cover', 'contain', 'stretch', 'center']).optional().default('cover'),
  onPress: ActionSchema.optional(),
})
