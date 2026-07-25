import React, { useCallback } from 'react'
import {
  ScrollView,
  Text,
  TouchableOpacity,
  View,
  type TextStyle,
  type ViewStyle,
} from 'react-native'
import { resolveNativeTextStyle } from '../../_base/text-style'
import { resolveSurfacePresentation } from '../../_base/style-surfaces'
import type { RuntimeSurfaceState } from '../../_base/surface-state'
import { useTokens } from '../../../context/AppContext'

const CARD_WIDTH = 220
const BADGE_PADDING_V = 4

export interface PricingTier {
  id: string
  name: string
  price: string
  period?: string
  description?: string
  features: string[]
  highlighted?: boolean
  cta: { label: string; onPress?: () => void }
}

export interface PricingTableBaseProps {
  tiers: PricingTier[]
  title?: string
  subtitle?: string
  highlightedLabel?: string
  /** Called when a tier CTA is pressed (in addition to that tier's onPress). */
  onTierCtaPress?: (tier: PricingTier) => void
  style?: ViewStyle
  slots?: Record<string, Record<string, unknown>>
  testID?: string
  id?: string
}

interface TierCardProps {
  tier: PricingTier
  highlightedLabel: string
  onCtaPress: (tier: PricingTier) => void
  testIDPrefix?: string
  slots?: Record<string, Record<string, unknown>>
  sharedTextStyle: TextStyle
}

function TierCard({
  tier,
  highlightedLabel,
  onCtaPress,
  testIDPrefix,
  slots,
  sharedTextStyle,
}: TierCardProps) {
  const tokens = useTokens()
  const tierStates: RuntimeSurfaceState[] | undefined = tier.highlighted ? ['selected'] : undefined

  const cardSurface = resolveSurfacePresentation({
    tokens,
    implementationBase: {
      width: CARD_WIDTH,
      bg: 'card',
      borderRadius: 'xl',
      border: tier.highlighted ? '2px solid primary' : '1px solid border',
      padding: 'xl',
      shadow: tier.highlighted ? 'lg' : 'sm',
    },
    componentSurface: slots?.card,
    activeStates: tierStates,
  })
  const popularBadgeSurface = resolveSurfacePresentation({
    tokens,
    implementationBase: {
      alignSelf: 'start',
      bg: 'primary',
      borderRadius: 'full',
      paddingX: 'md',
      paddingY: BADGE_PADDING_V,
      marginBottom: 'sm',
    },
    componentSurface: slots?.popularBadge,
    activeStates: tierStates,
  })
  const popularBadgeTextSurface = resolveSurfacePresentation({
    tokens,
    implementationBase: {
      fontSize: 'xs',
      color: 'primary-foreground',
      fontWeight: 'bold',
      letterSpacing: 0.3,
    },
    componentSurface: slots?.popularBadgeText,
    activeStates: tierStates,
  })
  const tierNameSurface = resolveSurfacePresentation({
    tokens,
    implementationBase: {
      fontSize: 'lg',
      color: 'foreground',
      fontWeight: 'bold',
      marginBottom: 'xs',
    },
    componentSurface: slots?.tierName,
    activeStates: tierStates,
  })
  const priceRowSurface = resolveSurfacePresentation({
    tokens,
    implementationBase: { flexDirection: 'row', alignItems: 'end' },
    componentSurface: slots?.priceRow,
    activeStates: tierStates,
  })
  const tierPriceSurface = resolveSurfacePresentation({
    tokens,
    implementationBase: { fontSize: 30, color: 'foreground', fontWeight: 'bold', lineHeight: 33 },
    componentSurface: slots?.tierPrice,
    activeStates: tierStates,
  })
  const tierPeriodSurface = resolveSurfacePresentation({
    tokens,
    implementationBase: { fontSize: 'sm', color: 'muted', marginTop: 'xs', marginBottom: 'xs' },
    componentSurface: slots?.tierPeriod,
    activeStates: tierStates,
  })
  const dividerSurface = resolveSurfacePresentation({
    tokens,
    implementationBase: { height: 1, bg: 'border', marginY: 'lg' },
    componentSurface: slots?.divider,
    activeStates: tierStates,
  })
  const tierDescriptionSurface = resolveSurfacePresentation({
    tokens,
    implementationBase: { fontSize: 'sm', color: 'muted', marginBottom: 'lg' },
    componentSurface: slots?.tierDescription,
    activeStates: tierStates,
  })
  const featureListSurface = resolveSurfacePresentation({
    tokens,
    implementationBase: { gap: 'sm', marginBottom: 'xl' },
    componentSurface: slots?.featureList,
    activeStates: tierStates,
  })
  const featureRowSurface = resolveSurfacePresentation({
    tokens,
    implementationBase: { flexDirection: 'row', alignItems: 'start', gap: 'sm' },
    componentSurface: slots?.featureRow,
    activeStates: tierStates,
  })
  const featureCheckSurface = resolveSurfacePresentation({
    tokens,
    implementationBase: { fontSize: 'sm', color: 'success', fontWeight: 'bold' },
    componentSurface: slots?.featureCheck,
    activeStates: tierStates,
  })
  const featureTextSurface = resolveSurfacePresentation({
    tokens,
    implementationBase: { flex: 1, fontSize: 'sm', color: 'foreground' },
    componentSurface: slots?.featureText,
    activeStates: tierStates,
  })
  const ctaButtonSurface = resolveSurfacePresentation({
    tokens,
    implementationBase: {
      borderRadius: 'md',
      paddingY: 'sm',
      paddingX: 'lg',
      alignItems: 'center',
      justifyContent: 'center',
      bg: tier.highlighted ? 'primary' : 'transparent',
      border: tier.highlighted ? '0px solid transparent' : '1px solid primary',
    },
    componentSurface: slots?.ctaButton,
    activeStates: tierStates,
  })
  const ctaButtonTextSurface = resolveSurfacePresentation({
    tokens,
    implementationBase: {
      fontSize: 'sm',
      fontWeight: 'semibold',
      color: tier.highlighted ? 'primary-foreground' : 'primary',
    },
    componentSurface: slots?.ctaButtonText,
    activeStates: tierStates,
  })

  return (
    <View style={cardSurface.style as ViewStyle | undefined} accessibilityRole="none">
      {tier.highlighted ? (
        <View style={popularBadgeSurface.style as ViewStyle | undefined}>
          <Text
            style={{
              ...sharedTextStyle,
              ...(popularBadgeTextSurface.style as TextStyle | undefined),
            }}
          >
            {highlightedLabel}
          </Text>
        </View>
      ) : null}
      <Text style={{ ...sharedTextStyle, ...(tierNameSurface.style as TextStyle | undefined) }}>
        {tier.name}
      </Text>
      <View style={priceRowSurface.style as ViewStyle | undefined}>
        <Text style={{ ...sharedTextStyle, ...(tierPriceSurface.style as TextStyle | undefined) }}>
          {tier.price}
        </Text>
      </View>
      {tier.period ? (
        <Text style={{ ...sharedTextStyle, ...(tierPeriodSurface.style as TextStyle | undefined) }}>
          {tier.period}
        </Text>
      ) : null}
      <View style={dividerSurface.style as ViewStyle | undefined} />
      {tier.description ? (
        <Text
          style={{
            ...sharedTextStyle,
            ...(tierDescriptionSurface.style as TextStyle | undefined),
          }}
        >
          {tier.description}
        </Text>
      ) : null}
      <View style={featureListSurface.style as ViewStyle | undefined}>
        {tier.features.map((feature, index) => (
          <View
            key={index}
            style={featureRowSurface.style as ViewStyle | undefined}
            accessibilityLabel={`Included: ${feature}`}
          >
            <Text
              style={{
                ...sharedTextStyle,
                ...(featureCheckSurface.style as TextStyle | undefined),
              }}
              accessibilityElementsHidden
              importantForAccessibility="no"
            >
              X
            </Text>
            <Text
              style={{ ...sharedTextStyle, ...(featureTextSurface.style as TextStyle | undefined) }}
            >
              {feature}
            </Text>
          </View>
        ))}
      </View>
      <TouchableOpacity
        onPress={() => onCtaPress(tier)}
        activeOpacity={0.8}
        style={ctaButtonSurface.style as ViewStyle | undefined}
        accessibilityRole="button"
        accessibilityLabel={`${tier.cta.label} - ${tier.name} plan`}
        testID={testIDPrefix ? `${testIDPrefix}-cta-${tier.id}` : undefined}
      >
        <Text
          style={{ ...sharedTextStyle, ...(ctaButtonTextSurface.style as TextStyle | undefined) }}
        >
          {tier.cta.label}
        </Text>
      </TouchableOpacity>
    </View>
  )
}

/**
 * Standalone PricingTable — plain React props, no manifest required.
 *
 * @example
 * <PricingTableBase
 *   title="Plans"
 *   tiers={[{ id: 'pro', name: 'Pro', price: '$10', features: ['x', 'y'], cta: { label: 'Choose' } }]}
 * />
 */
export function PricingTableBase({
  tiers,
  title,
  subtitle,
  highlightedLabel = 'Most Popular',
  onTierCtaPress,
  style,
  slots,
  testID,
  id,
}: PricingTableBaseProps) {
  const tokens = useTokens()
  const sharedTextStyle = resolveNativeTextStyle({}, tokens)

  const containerSurface = resolveSurfacePresentation({
    tokens,
    implementationBase: { width: '100%' },
    componentSurface: slots?.container,
  })
  const titleSurface = resolveSurfacePresentation({
    tokens,
    implementationBase: {
      fontSize: 24,
      color: 'foreground',
      fontWeight: 'bold',
      textAlign: 'center',
      marginBottom: 'sm',
    },
    componentSurface: slots?.title,
  })
  const subtitleSurface = resolveSurfacePresentation({
    tokens,
    implementationBase: {
      fontSize: 'base',
      color: 'muted',
      textAlign: 'center',
      marginBottom: 'xl',
    },
    componentSurface: slots?.subtitle,
  })
  const tiersRowSurface = resolveSurfacePresentation({
    tokens,
    implementationBase: {
      flexDirection: 'row',
      gap: 'lg',
      paddingX: 'lg',
      paddingBottom: 'lg',
      alignItems: 'start',
    },
    componentSurface: slots?.tiersRow,
  })

  const handleCtaPress = useCallback(
    (tier: PricingTier) => {
      tier.cta.onPress?.()
      onTierCtaPress?.(tier)
    },
    [onTierCtaPress],
  )

  return (
    <View style={[containerSurface.style as ViewStyle | undefined, style]} testID={testID ?? id}>
      {title ? (
        <Text style={{ ...sharedTextStyle, ...(titleSurface.style as TextStyle | undefined) }}>
          {title}
        </Text>
      ) : null}
      {subtitle ? (
        <Text style={{ ...sharedTextStyle, ...(subtitleSurface.style as TextStyle | undefined) }}>
          {subtitle}
        </Text>
      ) : null}
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={tiersRowSurface.style as ViewStyle | undefined}
        accessibilityRole="scrollbar"
        accessibilityLabel="Pricing tiers"
      >
        {tiers.map((tier) => (
          <TierCard
            key={tier.id}
            tier={tier}
            highlightedLabel={highlightedLabel}
            onCtaPress={handleCtaPress}
            testIDPrefix={testID}
            slots={slots}
            sharedTextStyle={sharedTextStyle}
          />
        ))}
      </ScrollView>
    </View>
  )
}
