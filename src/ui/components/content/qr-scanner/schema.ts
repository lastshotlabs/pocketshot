import { z } from 'zod'
import { extendComponentSchema, slotsSchema } from '../../_base/schema'
import { fromRefSchema as FromRefSchema } from '@lastshotlabs/frontend-contract/refs'
import type { Action } from '../../../actions/types'

const ActionSchema = z.custom<Action>()

export const QrScannerSchema = extendComponentSchema({
  id: z.string().optional(),
  onScan: ActionSchema,
  torchEnabled: z.boolean().optional().default(false),
  showOverlay: z.boolean().optional().default(true),
  overlayText: z.union([z.string(), FromRefSchema]).optional(),
  testID: z.string().optional(),
  slots: slotsSchema([
    'root',
    'overlayContainer',
    'topOverlay',
    'middleRow',
    'sideOverlay',
    'scanArea',
    'corner',
    'scanLine',
    'bottomOverlay',
    'overlayText',
    'fallback',
    'icon',
    'title',
    'message',
    'installCommand',
    'dividerRow',
    'dividerLine',
    'dividerText',
    'input',
    'submitButton',
    'submitText',
    'permissionContainer',
    'permissionText',
    'permissionButton',
    'permissionButtonText',
    'cameraContainer',
    'camera',
  ]).optional(),
})
