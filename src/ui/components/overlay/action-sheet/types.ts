import type { z } from 'zod'
import type { ActionSheetSchema } from './schema'
import type { Action } from '../../../actions/types'

export type ActionSheetConfig = z.input<typeof ActionSheetSchema>

export interface ActionSheetPayload {
  type: 'action-sheet'
  title?: string
  options: Array<{ label: string; action: Action; destructive?: boolean }>
}
