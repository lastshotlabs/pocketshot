
import { extendComponentSchema } from '../../_base'
import type { Action } from '../../../actions/types'

const ActionSchema = z.custom<Action>()

export const QrScannerSchema = extendComponentSchema({
  id: z.string().optional(),
  onScan: ActionSchema,
  torchEnabled: z.boolean().optional().default(false),
  showOverlay: z.boolean().optional().default(true),
  overlayText: z.string().optional(),
  testID: z.string().optional(),
})

