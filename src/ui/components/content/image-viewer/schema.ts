import { z } from 'zod'
import { extendComponentSchema, slotsSchema } from '../../_base/schema'
import { fromRefSchema as FromRefSchema } from '@lastshotlabs/frontend-contract/refs'

export const ImageViewerSchema = extendComponentSchema({
  source: z.union([z.string(), FromRefSchema]),
  alt: z.string().optional(),
  enableZoom: z.boolean().optional().default(true),
  maxZoom: z.number().optional().default(3),
  showCloseButton: z.boolean().optional().default(true),
  slots: slotsSchema([
    'root',
    'thumbnailContainer',
    'thumbnailImage',
    'modalBackdrop',
    'closeButton',
    'closeButtonText',
    'modalContent',
    'fullImage',
    'captionBar',
    'captionText',
  ]).optional(),
})
