import type { Action } from '../actions/types'
import type { ComponentConfig, ScreenConfig } from '../manifest/types'
import type { PresetFactory } from './types'

export interface DetailPresetConfig {
  id: string
  title: string
  /** Sections of field groups displayed in the detail card. */
  sections: {
    title?: string
    fields: { label: string; value: string; type?: string }[]
  }[]
  /** Action dispatched when the edit button is pressed. */
  onEdit?: Action
  /** Action dispatched when the back button is pressed. */
  onBack?: Action
}

/** Creates an entity detail screen: Header (with back + optional edit) + DetailCard. */
export const detailPreset: PresetFactory<DetailPresetConfig> = (config) => {
  const components: ComponentConfig[] = []

  const headerActions: ComponentConfig[] = []

  if (config.onEdit) {
    headerActions.push({
      type: 'Button',
      id: `${config.id}-edit-btn`,
      label: 'Edit',
      variant: 'ghost',
      onPress: config.onEdit,
    })
  }

  const header: ComponentConfig = {
    type: 'Header',
    id: `${config.id}-header`,
    title: config.title,
    showBack: true,
  }

  if (config.onBack) {
    header.onBack = config.onBack
  }

  if (headerActions.length > 0) {
    header.actions = headerActions
  }

  components.push(header)

  components.push({
    type: 'DetailCard',
    id: `${config.id}-detail`,
    sections: config.sections,
  })

  const screen: ScreenConfig = {
    id: config.id,
    title: config.title,
    components,
  }

  return screen
}
