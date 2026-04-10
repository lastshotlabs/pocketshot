import React, { useMemo } from 'react'
import { View, Text, Image, TouchableOpacity, StyleSheet } from 'react-native'
import { ComponentWrapper } from '../../_base/ComponentWrapper'
import { useTokens } from '../../../context/AppContext'
import { useScreenContext } from '../../../context/ScreenContext'
import { resolveFromRef } from '../../_base/fromRef'
import type { DesignTokens } from '../../../tokens/types'
import type { LinkEmbedConfig } from './types'
import type { Action, OpenUrlAction } from '../../../actions/types'

function getDomain(url: string): string {
  try {
    return new URL(url).hostname.replace(/^www\./, '')
  } catch {
    return url
  }
}

function isFaviconEmoji(favicon: string): boolean {
  // Emoji are <= 2 codepoints (with possible variation selectors/ZWJ)
  return favicon.length <= 8 && !/^https?:\/\//.test(favicon)
}

export function LinkEmbed({ config }: { config: LinkEmbedConfig }) {
  const tokens = useTokens()
  const { values, dispatch } = useScreenContext()

  const url = resolveFromRef(config.url, values) as string
  const title =
    config.title != null ? (resolveFromRef(config.title, values) as string) : undefined
  const description =
    config.description != null
      ? (resolveFromRef(config.description, values) as string)
      : undefined
  const imageUrl =
    config.imageUrl != null ? (resolveFromRef(config.imageUrl, values) as string) : undefined
  const domain =
    config.domain != null
      ? (resolveFromRef(config.domain, values) as string)
      : getDomain(url ?? '')

  const handlePress = useMemo(() => {
    const action: Action = config.onPress ?? (({ type: 'open-url', url: url ?? '' }) as OpenUrlAction)
    return () => void dispatch(action)
  }, [config.onPress, url, dispatch])

  const styles = useMemo(() => makeStyles(tokens), [tokens])

  const faviconIsEmoji =
    config.favicon != null ? isFaviconEmoji(config.favicon) : false

  return (
    <ComponentWrapper id={config.id} testID={config.testID}>
      <TouchableOpacity
        onPress={handlePress}
        style={styles.card}
        activeOpacity={0.8}
        accessibilityRole="link"
        accessibilityLabel={title ?? domain ?? url ?? 'Open link'}
        accessibilityHint={description ?? `Opens ${domain ?? url}`}
        testID={config.testID ?? config.id}
      >
        {/* Link icon top-right */}
        <View style={styles.externalBadge} pointerEvents="none">
          <Text style={styles.externalIcon} accessibilityElementsHidden>↗</Text>
        </View>

        {/* Preview image */}
        {imageUrl != null && (
          <Image
            source={{ uri: imageUrl }}
            style={styles.previewImage}
            resizeMode="cover"
            accessibilityLabel={title ?? domain ?? 'Link preview image'}
          />
        )}

        {/* Content */}
        <View style={styles.content}>
          {/* Domain row */}
          <View style={styles.domainRow}>
            {config.favicon != null && faviconIsEmoji && (
              <Text style={styles.faviconEmoji} accessibilityElementsHidden>
                {config.favicon}
              </Text>
            )}
            {config.favicon != null && !faviconIsEmoji && (
              <Image
                source={{ uri: config.favicon }}
                style={styles.faviconImage}
                resizeMode="contain"
                accessibilityLabel=""
              />
            )}
            <Text style={styles.domainText} numberOfLines={1}>
              {domain}
            </Text>
          </View>

          {/* Title */}
          {title != null && (
            <Text style={styles.title} numberOfLines={2}>
              {title}
            </Text>
          )}

          {/* Description */}
          {description != null && (
            <Text style={styles.description} numberOfLines={2}>
              {description}
            </Text>
          )}
        </View>
      </TouchableOpacity>
    </ComponentWrapper>
  )
}

function makeStyles(tokens: DesignTokens) {
  return StyleSheet.create({
    card: {
      backgroundColor: tokens.colors.surface,
      borderWidth: 1,
      borderColor: tokens.colors.border,
      borderRadius: tokens.radius.lg,
      overflow: 'hidden',
    },
    externalBadge: {
      position: 'absolute',
      top: tokens.spacing[2],
      right: tokens.spacing[2],
      zIndex: 1,
      backgroundColor: tokens.colors.overlay,
      borderRadius: tokens.radius.sm,
      paddingHorizontal: 4,
      paddingVertical: 2,
    },
    externalIcon: {
      fontSize: tokens.typography.fontSizeXs,
      color: tokens.colors.textMuted,
    },
    previewImage: {
      width: '100%',
      height: 140,
    },
    content: {
      padding: tokens.spacing[3],
    },
    domainRow: {
      flexDirection: 'row',
      alignItems: 'center',
      marginBottom: tokens.spacing[1],
    },
    faviconEmoji: {
      fontSize: 14,
      marginRight: tokens.spacing[1],
    },
    faviconImage: {
      width: 16,
      height: 16,
      marginRight: tokens.spacing[1],
    },
    domainText: {
      fontSize: tokens.typography.fontSizeXs,
      color: tokens.colors.textMuted,
      flex: 1,
    },
    title: {
      fontSize: tokens.typography.fontSizeSm,
      fontWeight: tokens.typography.fontWeightSemibold,
      color: tokens.colors.text,
      marginBottom: tokens.spacing[1],
    },
    description: {
      fontSize: tokens.typography.fontSizeXs,
      color: tokens.colors.textMuted,
    },
  })
}
