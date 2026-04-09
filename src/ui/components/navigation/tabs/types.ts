import type { z } from 'zod'
import type { TabsSchema } from './schema'

export type TabsConfig = z.infer<typeof TabsSchema>
