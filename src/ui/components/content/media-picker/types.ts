import type { z } from 'zod'
import type { MediaPickerSchema } from './schema'

export type MediaPickerConfig = z.input<typeof MediaPickerSchema>

export interface SelectedMediaItem {
  uri: string
  name: string
  type?: string
  size?: number
}
