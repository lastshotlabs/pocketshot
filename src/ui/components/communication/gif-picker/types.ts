import type { z } from 'zod'
import type { GifPickerSchema } from './schema'

export type GifPickerConfig = z.infer<typeof GifPickerSchema>

export interface GifResult {
  id: string
  url: string
  preview: string
  width: number
  height: number
}
