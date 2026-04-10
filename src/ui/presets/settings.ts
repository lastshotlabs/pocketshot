import type { Action } from '../actions/types'
import type { ComponentConfig, ScreenConfig } from '../manifest/types'
import type { PresetFactory } from './types'

export interface SettingsPresetConfig {
  id: string
  /** Screen title. Defaults to "Settings". */
  title?: string
  /** Grouped setting sections. */
  sections: {
    title: string
    items: {
      id: string
      type: 'switch' | 'select' | 'navigate'
      label: string
      description?: string
      defaultValue?: unknown
      options?: { label: string; value: string }[]
      /** Action dispatched for "navigate" type items. */
      action?: Action
    }[]
  }[]
}

/** Creates a settings screen: Header + Section groups with Switch/Select/navigation rows. */
export const settingsPreset: PresetFactory<SettingsPresetConfig> = (config) => {
  const title = config.title ?? 'Settings'
  const components: ComponentConfig[] = [
    {
      type: 'Header',
      id: `${config.id}-header`,
      title,
      showBack: true,
    },
  ]

  for (const section of config.sections) {
    const sectionComponents: ComponentConfig[] = []

    for (const item of section.items) {
      switch (item.type) {
        case 'switch': {
          sectionComponents.push({
            type: 'Switch',
            id: item.id,
            label: item.label,
            description: item.description,
            defaultValue: item.defaultValue ?? false,
          })
          break
        }
        case 'select': {
          sectionComponents.push({
            type: 'Select',
            id: item.id,
            label: item.label,
            description: item.description,
            options: item.options ?? [],
            defaultValue: item.defaultValue,
          })
          break
        }
        case 'navigate': {
          const row: ComponentConfig = {
            type: 'Button',
            id: item.id,
            label: item.label,
            description: item.description,
            variant: 'ghost',
            align: 'left',
            showChevron: true,
          }
          if (item.action) {
            row.onPress = item.action
          }
          sectionComponents.push(row)
          break
        }
      }
    }

    components.push({
      type: 'Section',
      id: `${config.id}-section-${section.title.toLowerCase().replace(/\s+/g, '-')}`,
      title: section.title,
      children: sectionComponents,
    })
  }

  const screen: ScreenConfig = {
    id: config.id,
    title,
    components,
  }

  return screen
}
