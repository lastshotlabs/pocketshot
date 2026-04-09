import type { z } from 'zod'
import type { AutoFormSchema } from './schema'

export type AutoFormConfig = z.infer<typeof AutoFormSchema>
export type AutoFormField = AutoFormConfig['fields'][number]
