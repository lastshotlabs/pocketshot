import type { z } from 'zod'
import type { PhoneInputSchema } from './schema'

export type PhoneInputConfig = z.infer<typeof PhoneInputSchema>

export interface CountryData {
  code: string
  name: string
  dialCode: string
  flag: string
}
