import { z } from 'zod'
import type { Action } from '../../../actions/types'

const ActionSchema = z.custom<Action>()
const FromRefSchema = z.object({ from: z.string() })

export const LinkEmbedSchema = z.object({
  id: z.string().optional(),
  url: z.union([z.string(), FromRefSchema]),
  title: z.union([z.string(), FromRefSchema]).optional(),
  description: z.union([z.string(), FromRefSchema]).optional(),
  imageUrl: z.union([z.string(), FromRefSchema]).optional(),
  favicon: z.string().optional(),
  domain: z.union([z.string(), FromRefSchema]).optional(),
  onPress: ActionSchema.optional(),
  testID: z.string().optional(),
})
