import type { z } from 'zod'
import type { ChatBubbleSchema } from './schema'

export type ChatBubbleConfig = z.input<typeof ChatBubbleSchema>
