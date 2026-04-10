import { z } from 'zod'

const FromRefSchema = z.object({ from: z.string() })

export const VideoPlayerSchema = z.object({
  id: z.string().optional(),
  source: z.union([z.string(), FromRefSchema]),
  poster: z.string().optional(),
  autoPlay: z.boolean().optional().default(false),
  loop: z.boolean().optional().default(false),
  muted: z.boolean().optional().default(false),
  controls: z.boolean().optional().default(true),
  aspectRatio: z.number().optional().default(16 / 9),
  testID: z.string().optional(),
})
