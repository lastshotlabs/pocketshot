import React, { useMemo } from 'react'
import { ComponentWrapper } from '../../_base/ComponentWrapper'
import { useScreenContext } from '../../../context/ScreenContext'
import { PricingTableBase, type PricingTier } from './standalone'
import type { PricingTableConfig } from './types'

export function PricingTable({ config }: { config: PricingTableConfig }) {
  const { dispatch } = useScreenContext()

  const tiers: PricingTier[] = useMemo(
    () =>
      config.tiers.map((tier) => ({
        id: tier.id,
        name: tier.name,
        price: tier.price,
        period: tier.period,
        description: tier.description,
        features: tier.features,
        highlighted: tier.highlighted,
        cta: {
          label: tier.cta.label,
          onPress: () => {
            void dispatch(tier.cta.onPress)
          },
        },
      })),
    [config.tiers, dispatch],
  )

  return (
    <ComponentWrapper id={config.id} testID={config.testID} config={config}>
      <PricingTableBase
        id={config.id}
        testID={config.testID}
        tiers={tiers}
        title={config.title}
        subtitle={config.subtitle}
        highlightedLabel={config.highlightedLabel}
        slots={config.slots as Record<string, Record<string, unknown>> | undefined}
      />
    </ComponentWrapper>
  )
}
