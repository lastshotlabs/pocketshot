import { z } from 'zod'
import { extendComponentSchema } from '../../_base'
import { fromRefSchema as FromRefSchema } from '@lastshotlabs/frontend-contract/refs'
import type { Action } from '../../../actions/types'

const ActionSchema = z.custom<Action>()

export const ImageSchema = extendComponentSchema({
  id: z.string().optional(),
  src: z.union([z.string(), FromRefSchema]),
  alt: z.string(),
  width: z.union([z.number(), z.literal('100%')]).optional(),
  height: z.number().optional(),
  aspectRatio: z.number().optional(),
  resizeMode: z.enum(['cover', 'contain', 'stretch', 'center']).optional().default('cover'),
  radius: z.enum(['none', 'sm', 'md', 'lg', 'xl', 'full']).optional().default('none'),
  onPress: ActionSchema.optional(),
  testID: z.string().optional(),
})


