import type { z } from 'zod'
import type { LocationInputSchema } from './schema'

export type LocationInputConfig = z.infer<typeof LocationInputSchema>

export interface LocationValue {
  latitude: number
  longitude: number
  address?: string
}
