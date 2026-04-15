import { z } from 'zod'
import { extendComponentSchema } from '../../_base/schema'
import { fromRefSchema as FromRefSchema } from '@lastshotlabs/frontend-contract/refs'

export const VideoPlayerSchema = extendComponentSchema({
  id: z.string().optional(),
  source: z.union([z.string(), FromRefSchema]),
  poster: z.string().optional(),
  autoPlay: z.boolean().optional().default(false),
  loop: z.boolean().optional().default(false),
  muted: z.boolean().optional().default(false),
  controls: z.boolean().optional().default(true),
  aspectRatio: z
    .number()
    .optional()
    .default(16 / 9),
  testID: z.string().optional(),
})
