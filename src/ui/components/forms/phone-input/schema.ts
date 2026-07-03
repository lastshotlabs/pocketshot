import { z } from 'zod'
import { extendComponentSchema, looseSlots } from '../../_base/schema'
import type { Action } from '../../../actions/types'

const ActionSchema = z.custom<Action>()

export const PhoneInputSchema = extendComponentSchema({
  id: z.string(),
  label: z.string().optional(),
  placeholder: z.string().optional().default('Phone number'),
  defaultCountry: z.string().optional().default('US'),
  helperText: z.string().optional(),
  errorText: z.string().optional(),
  onChangeAction: ActionSchema.optional(),
  testID: z.string().optional(),
  slots: looseSlots([
    'root',
    'container',
    'label',
    'inputRow',
    'countryButton',
    'countryFlag',
    'countryDialCode',
    'chevron',
    'divider',
    'phoneInput',
    'helperText',
    'errorText',
    'backdrop',
    'pickerPanel',
    'pickerHeader',
    'pickerTitle',
    'pickerCloseButton',
    'pickerClose',
    'searchContainer',
    'searchInput',
    'countryList',
    'countryRow',
    'countryRowFlag',
    'countryRowName',
    'countryRowDial',
    'checkmark',
    'emptyText',
  ]).optional(),
})
