import { z } from 'zod'
import { extendComponentSchema, looseSlots } from '../../_base/schema'
import { fromRefSchema as FromRefSchema } from '@lastshotlabs/frontend-contract/refs'
import type { Action } from '../../../actions/types'

const ActionSchema = z.custom<Action>()

export const FileUploaderSchema = extendComponentSchema({
  id: z.string(),
  label: z.union([z.string(), FromRefSchema]).optional(),
  accept: z.enum(['image', 'video', 'document', 'any']).optional().default('any'),
  multiple: z.boolean().optional().default(false),
  maxFiles: z.number().optional().default(5),
  maxSizeMb: z.number().optional().default(10),
  value: z.union([z.array(z.string()), FromRefSchema]).optional(),
  onChangeAction: ActionSchema.optional(),
  testID: z.string().optional(),
  slots: looseSlots([
    'root',
    'label',
    'dropZone',
    'dropIcon',
    'dropLabel',
    'dropSubtitle',
    'dropDisabledNote',
    'fileList',
    'fileRow',
    'thumbnail',
    'fileIcon',
    'fileIconText',
    'fileMeta',
    'fileName',
    'fileSize',
    'removeButton',
    'removeText',
  ]).optional(),
})
