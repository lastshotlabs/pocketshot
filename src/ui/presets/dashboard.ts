import type { ComponentConfig, ScreenConfig } from '../manifest/types'
import type { PresetFactory } from './types'

export interface DashboardPresetConfig {
  id: string
  title: string
  /** Stat cards displayed in a row at the top. */
  stats: {
    label: string
    value: string
    trend?: { direction: string; value: string }
  }[]
  /** Optional chart displayed below the stat cards. */
  chart?: {
    type: string
    data: { label: string; value: number }[]
    title?: string
  }
  /** Optional list displayed below the chart. */
  list?: {
    data: string
    itemType: string
    title?: string
  }
}

/** Creates a dashboard screen: Header + Row of StatCards + optional Chart + optional DataList. */
export const dashboardPreset: PresetFactory<DashboardPresetConfig> = (config) => {
  const components: ComponentConfig[] = [
    {
      type: 'Header',
      id: `${config.id}-header`,
      title: config.title,
    },
  ]

  // Stat cards in a horizontal row
  const statCards: ComponentConfig[] = config.stats.map((stat, index) => {
    const card: ComponentConfig = {
      type: 'StatCard',
      id: `${config.id}-stat-${index}`,
      label: stat.label,
      value: stat.value,
    }
    if (stat.trend) {
      card.trend = stat.trend
    }
    return card
  })

  components.push({
    type: 'Row',
    id: `${config.id}-stats-row`,
    gap: 'md',
    children: statCards,
  })

  if (config.chart) {
    const chart: ComponentConfig = {
      type: 'Chart',
      id: `${config.id}-chart`,
      chartType: config.chart.type,
      data: config.chart.data,
    }
    if (config.chart.title) {
      chart.title = config.chart.title
    }
    components.push(chart)
  }

  if (config.list) {
    if (config.list.title) {
      components.push({
        type: 'Heading',
        id: `${config.id}-list-heading`,
        text: config.list.title,
        level: 3,
      })
    }

    components.push({
      type: 'DataList',
      id: `${config.id}-list`,
      data: config.list.data,
      itemType: config.list.itemType,
    })
  }

  const screen: ScreenConfig = {
    id: config.id,
    title: config.title,
    components,
  }

  return screen
}
