import type { z } from 'zod'
import type { FileUploaderSchema } from './schema'

export type FileUploaderConfig = z.input<typeof FileUploaderSchema>

export interface FileItem {
  uri: string
  name: string
  size?: number
  type?: string
}
