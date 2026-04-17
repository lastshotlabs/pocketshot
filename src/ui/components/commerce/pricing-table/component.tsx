import React, { useCallback } from 'react'
import { View, Text, TouchableOpacity, ScrollView, type TextStyle, type ViewStyle } from 'react-native'
import { ComponentWrapper } from '../../_base/ComponentWrapper'
import { resolveNativeTextStyle, resolveSurfacePresentation } from '../../_base'
import type { RuntimeSurfaceState } from '../../_base'
import { useTokens } from '../../../context/AppContext'
import { useScreenContext } from '../../../context/ScreenContext'
import type { PricingTableConfig, PricingTier } from './types'

const CARD_WIDTH = 220
const BADGE_PADDING_V = 4

interface TierCardProps {
  tier: PricingTier
  highlightedLabel: string
  onCtaPress: (tier: PricingTier) => void
  testIDPrefix?: string
  slots: PricingTableConfig['slots']
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
  const handleCtaPress = useCallback(() => onCtaPress(tier), [onCtaPress, tier])
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
    componentSurface: slots?.card as Record<string, unknown> | undefined,
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
    componentSurface: slots?.popularBadge as Record<string, unknown> | undefined,
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
    componentSurface: slots?.popularBadgeText as Record<string, unknown> | undefined,
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
    componentSurface: slots?.tierName as Record<string, unknown> | undefined,
    activeStates: tierStates,
  })
  const priceRowSurface = resolveSurfacePresentation({
    tokens,
    implementationBase: {
      flexDirection: 'row',
      alignItems: 'end',
    },
    componentSurface: slots?.priceRow as Record<string, unknown> | undefined,
    activeStates: tierStates,
  })
  const tierPriceSurface = resolveSurfacePresentation({
    tokens,
    implementationBase: {
      fontSize: 30,
      color: 'foreground',
      fontWeight: 'bold',
      lineHeight: 33,
    },
    componentSurface: slots?.tierPrice as Record<string, unknown> | undefined,
    activeStates: tierStates,
  })
  const tierPeriodSurface = resolveSurfacePresentation({
    tokens,
    implementationBase: {
      fontSize: 'sm',
      color: 'muted',
      marginTop: 'xs',
      marginBottom: 'xs',
    },
    componentSurface: slots?.tierPeriod as Record<string, unknown> | undefined,
    activeStates: tierStates,
  })
  const dividerSurface = resolveSurfacePresentation({
    tokens,
    implementationBase: {
      height: 1,
      bg: 'border',
      marginY: 'lg',
    },
    componentSurface: slots?.divider as Record<string, unknown> | undefined,
    activeStates: tierStates,
  })
  const tierDescriptionSurface = resolveSurfacePresentation({
    tokens,
    implementationBase: {
      fontSize: 'sm',
      color: 'muted',
      marginBottom: 'lg',
    },
    componentSurface: slots?.tierDescription as Record<string, unknown> | undefined,
    activeStates: tierStates,
  })
  const featureListSurface = resolveSurfacePresentation({
    tokens,
    implementationBase: {
      gap: 'sm',
      marginBottom: 'xl',
    },
    componentSurface: slots?.featureList as Record<string, unknown> | undefined,
    activeStates: tierStates,
  })
  const featureRowSurface = resolveSurfacePresentation({
    tokens,
    implementationBase: {
      flexDirection: 'row',
      alignItems: 'start',
      gap: 'sm',
    },
    componentSurface: slots?.featureRow as Record<string, unknown> | undefined,
    activeStates: tierStates,
  })
  const featureCheckSurface = resolveSurfacePresentation({
    tokens,
    implementationBase: {
      fontSize: 'sm',
      color: 'success',
      fontWeight: 'bold',
    },
    componentSurface: slots?.featureCheck as Record<string, unknown> | undefined,
    activeStates: tierStates,
  })
  const featureTextSurface = resolveSurfacePresentation({
    tokens,
    implementationBase: {
      flex: 1,
      fontSize: 'sm',
      color: 'foreground',
    },
    componentSurface: slots?.featureText as Record<string, unknown> | undefined,
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
    componentSurface: slots?.ctaButton as Record<string, unknown> | undefined,
    activeStates: tierStates,
  })
  const ctaButtonTextSurface = resolveSurfacePresentation({
    tokens,
    implementationBase: {
      fontSize: 'sm',
      fontWeight: 'semibold',
      color: tier.highlighted ? 'primary-foreground' : 'primary',
    },
    componentSurface: slots?.ctaButtonText as Record<string, unknown> | undefined,
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
      <Text
        style={{
          ...sharedTextStyle,
          ...(tierNameSurface.style as TextStyle | undefined),
        }}
      >
        {tier.name}
      </Text>
      <View style={priceRowSurface.style as ViewStyle | undefined}>
        <Text
          style={{
            ...sharedTextStyle,
            ...(tierPriceSurface.style as TextStyle | undefined),
          }}
        >
          {tier.price}
        </Text>
      </View>
      {tier.period ? (
        <Text
          style={{
            ...sharedTextStyle,
            ...(tierPeriodSurface.style as TextStyle | undefined),
          }}
        >
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
              style={{
                ...sharedTextStyle,
                ...(featureTextSurface.style as TextStyle | undefined),
              }}
            >
              {feature}
            </Text>
          </View>
        ))}
      </View>
      <TouchableOpacity
        onPress={handleCtaPress}
        activeOpacity={0.8}
        style={ctaButtonSurface.style as ViewStyle | undefined}
        accessibilityRole="button"
        accessibilityLabel={`${tier.cta.label} - ${tier.name} plan`}
        testID={testIDPrefix ? `${testIDPrefix}-cta-${tier.id}` : undefined}
      >
        <Text
          style={{
            ...sharedTextStyle,
            ...(ctaButtonTextSurface.style as TextStyle | undefined),
          }}
        >
          {tier.cta.label}
        </Text>
      </TouchableOpacity>
    </View>
  )
}

export function PricingTable({ config }: { config: PricingTableConfig }) {
  const tokens = useTokens()
  const { dispatch } = useScreenContext()
  const sharedTextStyle = resolveNativeTextStyle(config as Record<string, unknown>, tokens)
  const highlightedLabel = config.highlightedLabel ?? 'Most Popular'

  const containerSurface = resolveSurfacePresentation({
    tokens,
    implementationBase: {
      width: '100%',
    },
    componentSurface: config.slots?.container as Record<string, unknown> | undefined,
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
    componentSurface: config.slots?.title as Record<string, unknown> | undefined,
  })
  const subtitleSurface = resolveSurfacePresentation({
    tokens,
    implementationBase: {
      fontSize: 'base',
      color: 'muted',
      textAlign: 'center',
      marginBottom: 'xl',
    },
    componentSurface: config.slots?.subtitle as Record<string, unknown> | undefined,
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
    componentSurface: config.slots?.tiersRow as Record<string, unknown> | undefined,
  })

  const handleCtaPress = useCallback(
    async (tier: PricingTier) => {
      await dispatch(tier.cta.onPress)
    },
    [dispatch],
  )

  return (
    <ComponentWrapper id={config.id} testID={config.testID} config={config}>
      <View style={containerSurface.style as ViewStyle | undefined}>
        {config.title ? (
          <Text
            style={{
              ...sharedTextStyle,
              ...(titleSurface.style as TextStyle | undefined),
            }}
          >
            {config.title}
          </Text>
        ) : null}
        {config.subtitle ? (
          <Text
            style={{
              ...sharedTextStyle,
              ...(subtitleSurface.style as TextStyle | undefined),
            }}
          >
            {config.subtitle}
          </Text>
        ) : null}
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={tiersRowSurface.style as ViewStyle | undefined}
          accessibilityRole="scrollbar"
          accessibilityLabel="Pricing tiers"
        >
          {config.tiers.map((tier) => (
            <TierCard
              key={tier.id}
              tier={tier}
              highlightedLabel={highlightedLabel}
              onCtaPress={handleCtaPress}
              testIDPrefix={config.testID}
              slots={config.slots}
              sharedTextStyle={sharedTextStyle}
            />
          ))}
        </ScrollView>
      </View>
    </ComponentWrapper>
  )
}
