import React, { useCallback, useMemo } from 'react'
import { View, Text, TouchableOpacity, StyleSheet, ScrollView } from 'react-native'
import { ComponentWrapper } from '../../_base/ComponentWrapper'
import { useTokens } from '../../../context/AppContext'
import { useScreenContext } from '../../../context/ScreenContext'
import type { DesignTokens } from '../../../tokens/types'
import type { PricingTableConfig, PricingTier } from './types'

const CARD_WIDTH = 220
const BADGE_PADDING_V = 4

interface TierCardProps {
  tier: PricingTier
  highlightedLabel: string
  tokens: DesignTokens
  styles: ReturnType<typeof makeStyles>
  onCtaPress: (tier: PricingTier) => void
  testIDPrefix?: string
}

function TierCard({ tier, highlightedLabel, tokens, styles, onCtaPress, testIDPrefix }: TierCardProps) {
  const handleCtaPress = useCallback(() => onCtaPress(tier), [onCtaPress, tier])

  return (
    <View
      style={[styles.card, tier.highlighted && styles.cardHighlighted]}
      accessibilityRole="none"
    >
      {tier.highlighted ? (
        <View style={styles.popularBadge}>
          <Text style={styles.popularBadgeText}>{highlightedLabel}</Text>
        </View>
      ) : null}

      <Text style={styles.tierName}>{tier.name}</Text>

      <View style={styles.priceRow}>
        <Text style={styles.tierPrice}>{tier.price}</Text>
      </View>

      {tier.period ? (
        <Text style={styles.tierPeriod}>{tier.period}</Text>
      ) : null}

      <View style={styles.divider} />

      {tier.description ? (
        <Text style={styles.tierDescription}>{tier.description}</Text>
      ) : null}

      <View style={styles.featureList}>
        {tier.features.map((feature, idx) => (
          <View
            key={idx}
            style={styles.featureRow}
            accessibilityLabel={`Included: ${feature}`}
          >
            <Text style={styles.featureCheck} accessibilityElementsHidden importantForAccessibility="no">
              ✓
            </Text>
            <Text style={styles.featureText}>{feature}</Text>
          </View>
        ))}
      </View>

      <TouchableOpacity
        onPress={handleCtaPress}
        activeOpacity={0.8}
        style={[styles.ctaButton, tier.highlighted ? styles.ctaButtonPrimary : styles.ctaButtonOutline]}
        accessibilityRole="button"
        accessibilityLabel={`${tier.cta.label} — ${tier.name} plan`}
        testID={testIDPrefix ? `${testIDPrefix}-cta-${tier.id}` : undefined}
      >
        <Text style={[styles.ctaButtonText, tier.highlighted ? styles.ctaButtonTextPrimary : styles.ctaButtonTextOutline]}>
          {tier.cta.label}
        </Text>
      </TouchableOpacity>
    </View>
  )
}

export function PricingTable({ config }: { config: PricingTableConfig }) {
  const tokens = useTokens()
  const { dispatch } = useScreenContext()
  const styles = useMemo(() => makeStyles(tokens), [tokens])

  const handleCtaPress = useCallback(
    async (tier: PricingTier) => {
      await dispatch(tier.cta.onPress)
    },
    [dispatch],
  )

  return (
    <ComponentWrapper id={config.id} testID={config.testID} config={config}>
      <View style={styles.container}>
        {config.title ? (
          <Text style={styles.title}>{config.title}</Text>
        ) : null}
        {config.subtitle ? (
          <Text style={styles.subtitle}>{config.subtitle}</Text>
        ) : null}

        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.tiersRow}
          accessibilityRole="scrollbar"
          accessibilityLabel="Pricing tiers"
        >
          {config.tiers.map((tier) => (
            <TierCard
              key={tier.id}
              tier={tier}
              highlightedLabel={config.highlightedLabel}
              tokens={tokens}
              styles={styles}
              onCtaPress={handleCtaPress}
              testIDPrefix={config.testID}
            />
          ))}
        </ScrollView>
      </View>
    </ComponentWrapper>
  )
}

function makeStyles(tokens: DesignTokens) {
  return StyleSheet.create({
    container: {
      width: '100%',
    },
    title: {
      fontSize: tokens.typography.fontSize2xl,
      color: tokens.colors.text,
      fontWeight: tokens.typography.fontWeightBold,
      textAlign: 'center',
      marginBottom: tokens.spacing[2],
    },
    subtitle: {
      fontSize: tokens.typography.fontSizeMd,
      color: tokens.colors.textMuted,
      textAlign: 'center',
      marginBottom: tokens.spacing[6],
      lineHeight: tokens.typography.fontSizeMd * tokens.typography.lineHeightNormal,
    },
    tiersRow: {
      flexDirection: 'row',
      gap: tokens.spacing[4],
      paddingHorizontal: tokens.spacing[4],
      paddingBottom: tokens.spacing[4],
      alignItems: 'flex-start',
    },
    card: {
      width: CARD_WIDTH,
      backgroundColor: tokens.colors.surface,
      borderRadius: tokens.radius.xl,
      borderWidth: 1,
      borderColor: tokens.colors.border,
      padding: tokens.spacing[5],
      ...tokens.shadows.sm,
    },
    cardHighlighted: {
      borderWidth: 2,
      borderColor: tokens.colors.primary,
      ...tokens.shadows.lg,
    },
    popularBadge: {
      alignSelf: 'flex-start',
      backgroundColor: tokens.colors.primary,
      borderRadius: tokens.radius.full,
      paddingHorizontal: tokens.spacing[3],
      paddingVertical: BADGE_PADDING_V,
      marginBottom: tokens.spacing[3],
    },
    popularBadgeText: {
      fontSize: tokens.typography.fontSizeXs,
      color: tokens.colors.primaryForeground,
      fontWeight: tokens.typography.fontWeightBold,
      letterSpacing: 0.3,
    },
    tierName: {
      fontSize: tokens.typography.fontSizeLg,
      color: tokens.colors.text,
      fontWeight: tokens.typography.fontWeightBold,
      marginBottom: tokens.spacing[2],
    },
    priceRow: {
      flexDirection: 'row',
      alignItems: 'flex-end',
    },
    tierPrice: {
      fontSize: tokens.typography.fontSize3xl,
      color: tokens.colors.text,
      fontWeight: tokens.typography.fontWeightBold,
      lineHeight: tokens.typography.fontSize3xl * 1.1,
    },
    tierPeriod: {
      fontSize: tokens.typography.fontSizeSm,
      color: tokens.colors.textMuted,
      marginTop: tokens.spacing[1],
      marginBottom: tokens.spacing[2],
    },
    divider: {
      height: StyleSheet.hairlineWidth,
      backgroundColor: tokens.colors.divider,
      marginVertical: tokens.spacing[4],
    },
    tierDescription: {
      fontSize: tokens.typography.fontSizeSm,
      color: tokens.colors.textMuted,
      lineHeight: tokens.typography.fontSizeSm * tokens.typography.lineHeightNormal,
      marginBottom: tokens.spacing[4],
    },
    featureList: {
      gap: tokens.spacing[2],
      marginBottom: tokens.spacing[6],
    },
    featureRow: {
      flexDirection: 'row',
      alignItems: 'flex-start',
      gap: tokens.spacing[2],
    },
    featureCheck: {
      fontSize: tokens.typography.fontSizeSm,
      color: tokens.colors.success,
      fontWeight: tokens.typography.fontWeightBold,
      lineHeight: tokens.typography.fontSizeSm * tokens.typography.lineHeightNormal,
    },
    featureText: {
      flex: 1,
      fontSize: tokens.typography.fontSizeSm,
      color: tokens.colors.text,
      lineHeight: tokens.typography.fontSizeSm * tokens.typography.lineHeightNormal,
    },
    ctaButton: {
      borderRadius: tokens.radius.md,
      paddingVertical: tokens.spacing[3],
      paddingHorizontal: tokens.spacing[4],
      alignItems: 'center',
      justifyContent: 'center',
    },
    ctaButtonPrimary: {
      backgroundColor: tokens.colors.primary,
    },
    ctaButtonOutline: {
      backgroundColor: 'transparent',
      borderWidth: 1.5,
      borderColor: tokens.colors.primary,
    },
    ctaButtonText: {
      fontSize: tokens.typography.fontSizeSm,
      fontWeight: tokens.typography.fontWeightSemibold,
    },
    ctaButtonTextPrimary: {
      color: tokens.colors.primaryForeground,
    },
    ctaButtonTextOutline: {
      color: tokens.colors.primary,
    },
  })
}

