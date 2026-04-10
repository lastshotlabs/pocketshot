import { z } from 'zod'

const FromRefSchema = z.object({ from: z.string() })

export const AudioPlayerSchema = z.object({
  id: z.string().optional(),
  source: z.union([z.string(), FromRefSchema]),
  title: z.string().optional(),
  artist: z.string().optional(),
  showWaveform: z.boolean().optional().default(true),
  autoPlay: z.boolean().optional().default(false),
  testID: z.string().optional(),
})
