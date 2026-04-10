import type { Action } from '../actions/types'
import type { ComponentConfig, ScreenConfig } from '../manifest/types'
import type { PresetFactory } from './types'

export interface ListPresetConfig {
  id: string
  title: string
  /** API endpoint for list data (e.g. "GET /api/users"). */
  data: string
  /** Item component type to render per row (e.g. "Card", "ProductCard"). */
  itemType: string
  /** Optional filter tabs shown above the list. */
  filters?: { id: string; label: string }[]
  /** Whether to show a search input above the list. */
  searchable?: boolean
  /** Whether to enable pull-to-refresh. */
  refreshable?: boolean
  /** Action dispatched when an item is pressed. */
  onItemPress?: Action
  /** Message shown when the list is empty. */
  emptyMessage?: string
}

/** Creates a standard list screen: Header + optional FilterBar + DataList. */
export const listPreset: PresetFactory<ListPresetConfig> = (config) => {
  const components: ComponentConfig[] = [
    {
      type: 'Header',
      id: `${config.id}-header`,
      title: config.title,
    },
  ]

  if (config.filters && config.filters.length > 0) {
    components.push({
      type: 'FilterBar',
      id: `${config.id}-filters`,
      filters: config.filters.map((f) => ({
        id: f.id,
        label: f.label,
      })),
    })
  }

  const dataList: ComponentConfig = {
    type: 'DataList',
    id: `${config.id}-list`,
    data: config.data,
    itemType: config.itemType,
    searchable: config.searchable ?? false,
    refreshable: config.refreshable ?? true,
  }

  if (config.onItemPress) {
    dataList.onItemPress = config.onItemPress
  }

  if (config.emptyMessage) {
    dataList.emptyMessage = config.emptyMessage
  }

  components.push(dataList)

  const screen: ScreenConfig = {
    id: config.id,
    title: config.title,
    components,
  }

  return screen
}
