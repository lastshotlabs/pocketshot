import type { Action } from '../actions/types'
import type { ComponentConfig, ScreenConfig } from '../manifest/types'
import type { PresetFactory } from './types'

export interface FormPresetConfig {
  id: string
  title: string
  /** Form field definitions. */
  fields: {
    id: string
    type: string
    label: string
    placeholder?: string
    required?: boolean
    options?: { label: string; value: string }[]
  }[]
  /** Label for the submit button. Defaults to "Submit". */
  submitLabel?: string
  /** Action dispatched on form submission. */
  onSubmit: Action
  /** Action dispatched when cancel is pressed. */
  onCancel?: Action
}

/** Creates a form screen: Header + AutoForm with submit/cancel actions. */
export const formPreset: PresetFactory<FormPresetConfig> = (config) => {
  const components: ComponentConfig[] = []

  const header: ComponentConfig = {
    type: 'Header',
    id: `${config.id}-header`,
    title: config.title,
    showBack: true,
  }

  if (config.onCancel) {
    header.onBack = config.onCancel
  }

  components.push(header)

  components.push({
    type: 'AutoForm',
    id: `${config.id}-form`,
    fields: config.fields,
    submitLabel: config.submitLabel ?? 'Submit',
    onSubmit: config.onSubmit,
  })

  const screen: ScreenConfig = {
    id: config.id,
    title: config.title,
    components,
  }

  return screen
}
