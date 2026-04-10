import type { z } from 'zod'
import type { CompareViewSchema } from './schema'

export type CompareViewConfig = z.infer<typeof CompareViewSchema>

export type DiffLineType = 'unchanged' | 'added' | 'removed'

export interface DiffLine {
  type: DiffLineType
  leftLineNum: number | null
  rightLineNum: number | null
  content: string
}
