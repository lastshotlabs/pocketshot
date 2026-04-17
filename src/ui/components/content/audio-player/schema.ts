import { z } from 'zod'
import { extendComponentSchema, slotsSchema } from '../../_base/schema'
import { fromRefSchema as FromRefSchema } from '@lastshotlabs/frontend-contract/refs'

export const AudioPlayerSchema = extendComponentSchema({
  id: z.string().optional(),
  source: z.union([z.string(), FromRefSchema]),
  title: z.union([z.string(), FromRefSchema]).optional(),
  artist: z.union([z.string(), FromRefSchema]).optional(),
  showWaveform: z.boolean().optional().default(true),
  autoPlay: z.boolean().optional().default(false),
  testID: z.string().optional(),
  slots: slotsSchema([
    'root',
    'container',
    'playButton',
    'playIcon',
    'centerSection',
    'metaRow',
    'title',
    'artist',
    'waveform',
    'waveformBar',
    'progressContainer',
    'progressTrack',
    'progressFill',
    'timeRow',
    'timeText',
    'fallback',
    'fallbackIcon',
    'fallbackTitle',
    'fallbackMessage',
    'fallbackCommand',
  ]).optional(),
})
