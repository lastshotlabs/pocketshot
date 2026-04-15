import { z } from 'zod'
import { extendComponentSchema } from '../../_base'
import { fromRefSchema as FromRefSchema } from '@lastshotlabs/frontend-contract/refs'


export const AudioPlayerSchema = extendComponentSchema({
  id: z.string().optional(),
  source: z.union([z.string(), FromRefSchema]),
  title: z.string().optional(),
  artist: z.string().optional(),
  showWaveform: z.boolean().optional().default(true),
  autoPlay: z.boolean().optional().default(false),
  testID: z.string().optional(),
})


