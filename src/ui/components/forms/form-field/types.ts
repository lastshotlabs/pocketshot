import type { z } from 'zod'
import type { FormFieldSchema } from './schema'

export type FormFieldConfig = z.infer<typeof FormFieldSchema>
