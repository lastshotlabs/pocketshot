import type { z } from 'zod'
import type { EmojiPickerSchema } from './schema'

export type EmojiPickerConfig = z.infer<typeof EmojiPickerSchema>

export interface EmojiCategory {
  name: string
  emojis: string[]
}
