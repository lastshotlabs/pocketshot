import type { Action } from '../actions/types'
import type { ComponentConfig, ScreenConfig } from '../manifest/types'
import type { PresetFactory } from './types'

export interface PricingPresetConfig {
  id: string
  /** Screen title. Defaults to "Pricing". */
  title?: string
  /** Subtitle displayed below the title. */
  subtitle?: string
  /** Pricing tiers to display. */
  tiers: {
    id: string
    name: string
    price: string
    period?: string
    description?: string
    features: string[]
    cta: { label: string; onPress: Action }
    highlighted?: boolean
  }[]
}

/** Creates a pricing screen: Header + optional subtitle + PricingTable. */
export const pricingPreset: PresetFactory<PricingPresetConfig> = (config) => {
  const title = config.title ?? 'Pricing'

  const components: ComponentConfig[] = [
    {
      type: 'Header',
      id: `${config.id}-header`,
      title,
    },
  ]

  if (config.subtitle) {
    components.push({
      type: 'Body',
      id: `${config.id}-subtitle`,
      text: config.subtitle,
      textAlign: 'center',
    })
  }

  components.push({
    type: 'PricingTable',
    id: `${config.id}-pricing-table`,
    tiers: config.tiers,
  })

  const screen: ScreenConfig = {
    id: config.id,
    title,
    components,
  }

  return screen
}
