import { z } from 'zod'
import type { Action } from '../../../actions/types'

const FromRefSchema = z.object({ from: z.string() })
const ActionSchema = z.custom<Action>()

export const ImageSchema = z.object({
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
