import React, { useMemo } from 'react'
import { View, Text, Image, TouchableOpacity, StyleSheet } from 'react-native'
import { ComponentWrapper } from '../../_base/ComponentWrapper'
import { useTokens } from '../../../context/AppContext'
import { useScreenContext } from '../../../context/ScreenContext'
import { resolveFromRef } from '../../_base/fromRef'
import type { DesignTokens } from '../../../tokens/types'
import type { LinkEmbedConfig } from './types'
import type { Action, OpenUrlAction } from '../../../actions/types'

// ── Provider detection ───────────────────────────────────────────────────────

type Provider = 'youtube' | 'twitter' | 'github' | 'spotify' | 'figma' | 'notion' | 'linear' | 'generic'

const PROVIDER_PATTERNS: [Provider, RegExp][] = [
  ['youtube', /(?:youtube\.com|youtu\.be)/i],
  ['twitter', /(?:twitter\.com|x\.com)/i],
  ['github', /github\.com/i],
  ['spotify', /(?:spotify\.com|open\.spotify)/i],
  ['figma', /figma\.com/i],
  ['notion', /notion\.(?:so|site)/i],
  ['linear', /linear\.app/i],
]

function detectProvider(url: string): Provider {
  for (const [provider, pattern] of PROVIDER_PATTERNS) {
    if (pattern.test(url)) return provider
  }
  return 'generic'
}

function extractYouTubeId(url: string): string | null {
  const match = url.match(/(?:v=|youtu\.be\/)([a-zA-Z0-9_-]{11})/)
  return match ? match[1] : null
}

function getDomain(url: string): string {
  try {
    return new URL(url).hostname.replace(/^www\./, '')
  } catch {
    return url
  }
}

function formatNumber(n: number): string {
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M`
  if (n >= 1_000) return `${(n / 1_000).toFixed(1)}K`
  return String(n)
}

function formatDuration(ms: number): string {
  const totalSeconds = Math.floor(ms / 1000)
  const minutes = Math.floor(totalSeconds / 60)
  const seconds = totalSeconds % 60
  return `${minutes}:${seconds.toString().padStart(2, '0')}`
}

// ── Provider brand colors ────────────────────────────────────────────────────

const BRAND_COLORS: Record<Provider, string> = {
  youtube: '#FF0000',
  twitter: '#1DA1F2',
  github: '#24292e',
  spotify: '#1DB954',
  figma: '#A259FF',
  notion: '#000000',
  linear: '#5E6AD2',
  generic: '#6B7280',
}

const BRAND_ICONS: Record<Provider, string> = {
  youtube: '▶',
  twitter: '𝕏',
  github: '◉',
  spotify: '♫',
  figma: '◆',
  notion: '■',
  linear: '◇',
  generic: '↗',
}

// ── YouTube embed ────────────────────────────────────────────────────────────

function YouTubeEmbed({
  config,
  url,
  title,
  tokens,
  onPress,
}: {
  config: LinkEmbedConfig
  url: string
  title?: string
  tokens: DesignTokens
  onPress: () => void
}) {
  const videoId = config.videoId ?? extractYouTubeId(url)
  const thumbnailUrl = videoId
    ? `https://img.youtube.com/vi/${videoId}/hqdefault.jpg`
    : config.imageUrl as string | undefined

  const s = useMemo(() => makeProviderStyles(tokens), [tokens])

  return (
    <TouchableOpacity
      onPress={onPress}
      style={s.card}
      activeOpacity={0.85}
      accessibilityRole="link"
      accessibilityLabel={title ?? 'YouTube video'}
      testID={config.testID ?? config.id}
    >
      <View style={s.thumbnailContainer}>
        {thumbnailUrl != null && (
          <Image
            source={{ uri: thumbnailUrl }}
            style={s.thumbnail16x9}
            resizeMode="cover"
            accessibilityLabel={title ?? 'Video thumbnail'}
          />
        )}
        <View style={s.playOverlay}>
          <View style={[s.playButton, { backgroundColor: BRAND_COLORS.youtube }]}>
            <Text style={s.playIcon}>▶</Text>
          </View>
        </View>
      </View>
      <View style={s.body}>
        <View style={s.providerRow}>
          <View style={[s.providerDot, { backgroundColor: BRAND_COLORS.youtube }]} />
          <Text style={s.providerLabel}>YouTube</Text>
        </View>
        {title != null && (
          <Text style={s.title} numberOfLines={2}>{title}</Text>
        )}
        {config.description != null && (
          <Text style={s.description} numberOfLines={2}>
            {typeof config.description === 'string' ? config.description : ''}
          </Text>
        )}
      </View>
    </TouchableOpacity>
  )
}

// ── Twitter/X embed ──────────────────────────────────────────────────────────

function TwitterEmbed({
  config,
  url,
  title,
  tokens,
  onPress,
}: {
  config: LinkEmbedConfig
  url: string
  title?: string
  tokens: DesignTokens
  onPress: () => void
}) {
  const s = useMemo(() => makeProviderStyles(tokens), [tokens])

  return (
    <TouchableOpacity
      onPress={onPress}
      style={s.card}
      activeOpacity={0.85}
      accessibilityRole="link"
      accessibilityLabel={config.tweetText ?? title ?? 'Tweet'}
      testID={config.testID ?? config.id}
    >
      <View style={s.body}>
        {/* Header: avatar + name + handle */}
        <View style={s.twitterHeader}>
          {config.authorAvatarUrl != null ? (
            <Image
              source={{ uri: config.authorAvatarUrl }}
              style={s.twitterAvatar}
              resizeMode="cover"
              accessibilityLabel={config.authorName ?? 'Author'}
            />
          ) : (
            <View style={[s.twitterAvatar, { backgroundColor: tokens.colors.surfaceAlt, alignItems: 'center', justifyContent: 'center' }]}>
              <Text style={{ fontSize: tokens.typography.fontSizeXs, color: tokens.colors.text }}>
                {config.authorName ? config.authorName[0].toUpperCase() : '?'}
              </Text>
            </View>
          )}
          <View style={{ flex: 1 }}>
            <Text style={s.twitterName} numberOfLines={1}>
              {config.authorName ?? 'Unknown'}
            </Text>
            {config.authorHandle != null && (
              <Text style={s.twitterHandle} numberOfLines={1}>@{config.authorHandle}</Text>
            )}
          </View>
          <Text style={[s.brandIcon, { color: BRAND_COLORS.twitter }]}>𝕏</Text>
        </View>

        {/* Tweet text */}
        {config.tweetText != null && (
          <Text style={s.tweetText} numberOfLines={4}>{config.tweetText}</Text>
        )}

        {/* Image */}
        {config.imageUrl != null && (
          <Image
            source={{ uri: typeof config.imageUrl === 'string' ? config.imageUrl : '' }}
            style={s.tweetImage}
            resizeMode="cover"
            accessibilityLabel="Tweet image"
          />
        )}

        {/* Metrics */}
        {config.metrics != null && (
          <View style={s.metricsRow}>
            {config.metrics.replies != null && (
              <Text style={s.metricText}>💬 {formatNumber(config.metrics.replies)}</Text>
            )}
            {config.metrics.retweets != null && (
              <Text style={s.metricText}>🔁 {formatNumber(config.metrics.retweets)}</Text>
            )}
            {config.metrics.likes != null && (
              <Text style={s.metricText}>❤️ {formatNumber(config.metrics.likes)}</Text>
            )}
          </View>
        )}
      </View>
    </TouchableOpacity>
  )
}

// ── GitHub embed ─────────────────────────────────────────────────────────────

function GitHubEmbed({
  config,
  url,
  title,
  tokens,
  onPress,
}: {
  config: LinkEmbedConfig
  url: string
  title?: string
  tokens: DesignTokens
  onPress: () => void
}) {
  const s = useMemo(() => makeProviderStyles(tokens), [tokens])

  // Try to extract owner/repo from URL
  const urlParts = url.match(/github\.com\/([^/]+)\/([^/]+)/)
  const owner = config.repoOwner ?? urlParts?.[1]
  const repo = config.repoName ?? urlParts?.[2]?.replace(/\.git$/, '')

  return (
    <TouchableOpacity
      onPress={onPress}
      style={s.card}
      activeOpacity={0.85}
      accessibilityRole="link"
      accessibilityLabel={owner != null && repo != null ? `${owner}/${repo}` : title ?? 'GitHub repository'}
      testID={config.testID ?? config.id}
    >
      <View style={s.body}>
        <View style={s.providerRow}>
          <View style={[s.providerDot, { backgroundColor: BRAND_COLORS.github }]} />
          <Text style={s.providerLabel}>GitHub</Text>
        </View>

        <Text style={s.ghRepoName} numberOfLines={1}>
          {owner != null && repo != null ? `${owner} / ${repo}` : title ?? url}
        </Text>

        {(config.repoDescription ?? config.description) != null && (
          <Text style={s.description} numberOfLines={3}>
            {config.repoDescription ?? (typeof config.description === 'string' ? config.description : '')}
          </Text>
        )}

        <View style={s.ghStatsRow}>
          {config.language != null && (
            <View style={s.ghStat}>
              <View style={[s.ghLangDot, { backgroundColor: config.languageColor ?? tokens.colors.primary }]} />
              <Text style={s.ghStatText}>{config.language}</Text>
            </View>
          )}
          {config.stars != null && (
            <View style={s.ghStat}>
              <Text style={s.ghStatIcon}>★</Text>
              <Text style={s.ghStatText}>{formatNumber(config.stars)}</Text>
            </View>
          )}
          {config.forks != null && (
            <View style={s.ghStat}>
              <Text style={s.ghStatIcon}>⑂</Text>
              <Text style={s.ghStatText}>{formatNumber(config.forks)}</Text>
            </View>
          )}
        </View>
      </View>
    </TouchableOpacity>
  )
}

// ── Spotify embed ────────────────────────────────────────────────────────────

function SpotifyEmbed({
  config,
  url,
  title,
  tokens,
  onPress,
}: {
  config: LinkEmbedConfig
  url: string
  title?: string
  tokens: DesignTokens
  onPress: () => void
}) {
  const s = useMemo(() => makeProviderStyles(tokens), [tokens])

  return (
    <TouchableOpacity
      onPress={onPress}
      style={[s.card, { backgroundColor: '#191414' }]}
      activeOpacity={0.85}
      accessibilityRole="link"
      accessibilityLabel={config.trackName ?? title ?? 'Spotify track'}
      testID={config.testID ?? config.id}
    >
      <View style={[s.body, { flexDirection: 'row', alignItems: 'center' }]}>
        {config.albumArtUrl != null && (
          <Image
            source={{ uri: config.albumArtUrl }}
            style={s.spotifyAlbumArt}
            resizeMode="cover"
            accessibilityLabel="Album art"
          />
        )}
        <View style={{ flex: 1, marginLeft: config.albumArtUrl != null ? 12 : 0 }}>
          <View style={[s.providerRow, { marginBottom: 4 }]}>
            <View style={[s.providerDot, { backgroundColor: BRAND_COLORS.spotify }]} />
            <Text style={[s.providerLabel, { color: '#B3B3B3' }]}>Spotify</Text>
          </View>
          <Text style={[s.title, { color: '#FFFFFF' }]} numberOfLines={1}>
            {config.trackName ?? title}
          </Text>
          {config.artistName != null && (
            <Text style={[s.description, { color: '#B3B3B3' }]} numberOfLines={1}>
              {config.artistName}
            </Text>
          )}
          {config.durationMs != null && (
            <Text style={[s.metricText, { color: '#686868', marginTop: 4 }]}>
              {formatDuration(config.durationMs)}
            </Text>
          )}
        </View>
        <View style={[s.playButton, { backgroundColor: BRAND_COLORS.spotify, width: 40, height: 40 }]}>
          <Text style={[s.playIcon, { fontSize: 16 }]}>▶</Text>
        </View>
      </View>
    </TouchableOpacity>
  )
}

// ── Figma embed ──────────────────────────────────────────────────────────────

function FigmaEmbed({
  config,
  url,
  title,
  tokens,
  onPress,
}: {
  config: LinkEmbedConfig
  url: string
  title?: string
  tokens: DesignTokens
  onPress: () => void
}) {
  const s = useMemo(() => makeProviderStyles(tokens), [tokens])
  const imageUrl = config.thumbnailUrl ?? (typeof config.imageUrl === 'string' ? config.imageUrl : undefined)

  return (
    <TouchableOpacity
      onPress={onPress}
      style={s.card}
      activeOpacity={0.85}
      accessibilityRole="link"
      accessibilityLabel={config.fileName ?? title ?? 'Figma file'}
      testID={config.testID ?? config.id}
    >
      {imageUrl != null && (
        <Image
          source={{ uri: imageUrl }}
          style={s.thumbnail16x9}
          resizeMode="cover"
          accessibilityLabel="Figma preview"
        />
      )}
      <View style={s.body}>
        <View style={s.providerRow}>
          <View style={[s.providerDot, { backgroundColor: BRAND_COLORS.figma }]} />
          <Text style={s.providerLabel}>Figma</Text>
        </View>
        <Text style={s.title} numberOfLines={2}>
          {config.fileName ?? title ?? 'Untitled'}
        </Text>
        {config.lastModified != null && (
          <Text style={s.description}>Last modified: {config.lastModified}</Text>
        )}
      </View>
    </TouchableOpacity>
  )
}

// ── Generic embed (fallback) ─────────────────────────────────────────────────

function GenericEmbed({
  config,
  url,
  title,
  description,
  imageUrl,
  domain,
  tokens,
  onPress,
  provider,
}: {
  config: LinkEmbedConfig
  url: string
  title?: string
  description?: string
  imageUrl?: string
  domain: string
  tokens: DesignTokens
  onPress: () => void
  provider: Provider
}) {
  const s = useMemo(() => makeProviderStyles(tokens), [tokens])
  const isKnownProvider = provider !== 'generic'
  const brandColor = BRAND_COLORS[provider]
  const brandIcon = BRAND_ICONS[provider]
  const providerName = provider === 'generic' ? domain : provider.charAt(0).toUpperCase() + provider.slice(1)

  return (
    <TouchableOpacity
      onPress={onPress}
      style={s.card}
      activeOpacity={0.85}
      accessibilityRole="link"
      accessibilityLabel={title ?? domain ?? url ?? 'Open link'}
      accessibilityHint={description ?? `Opens ${domain ?? url}`}
      testID={config.testID ?? config.id}
    >
      {imageUrl != null && (
        <Image
          source={{ uri: imageUrl }}
          style={s.thumbnail16x9}
          resizeMode="cover"
          accessibilityLabel={title ?? domain ?? 'Link preview'}
        />
      )}
      <View style={s.body}>
        <View style={s.providerRow}>
          {isKnownProvider ? (
            <View style={[s.providerDot, { backgroundColor: brandColor }]} />
          ) : config.favicon != null ? (
            config.favicon.length <= 8 && !/^https?:\/\//.test(config.favicon) ? (
              <Text style={{ fontSize: 12, marginRight: 6 }}>{config.favicon}</Text>
            ) : (
              <Image
                source={{ uri: config.favicon }}
                style={{ width: 14, height: 14, borderRadius: 2, marginRight: 6 }}
                resizeMode="contain"
                accessibilityLabel=""
              />
            )
          ) : null}
          <Text style={s.providerLabel}>{providerName}</Text>
          <Text style={[s.externalArrow, { color: tokens.colors.textMuted }]}>↗</Text>
        </View>
        {title != null && (
          <Text style={s.title} numberOfLines={2}>{title}</Text>
        )}
        {description != null && (
          <Text style={s.description} numberOfLines={2}>{description}</Text>
        )}
      </View>
    </TouchableOpacity>
  )
}

// ── Main component ───────────────────────────────────────────────────────────

export function LinkEmbed({ config }: { config: LinkEmbedConfig }) {
  const tokens = useTokens()
  const { values, dispatch } = useScreenContext()

  const url = resolveFromRef(config.url, values) as string
  const title = config.title != null ? (resolveFromRef(config.title, values) as string) : undefined
  const description = config.description != null ? (resolveFromRef(config.description, values) as string) : undefined
  const imageUrl = config.imageUrl != null ? (resolveFromRef(config.imageUrl, values) as string) : undefined
  const domain = config.domain != null ? (resolveFromRef(config.domain, values) as string) : getDomain(url ?? '')

  const provider: Provider = config.provider ?? detectProvider(url ?? '')

  const handlePress = useMemo(() => {
    const action: Action = config.onPress ?? (({ type: 'open-url', url: url ?? '' }) as OpenUrlAction)
    return () => void dispatch(action)
  }, [config.onPress, url, dispatch])

  return (
    <ComponentWrapper id={config.id} testID={config.testID} config={config}>
      {provider === 'youtube' ? (
        <YouTubeEmbed config={config} url={url} title={title} tokens={tokens} onPress={handlePress} />
      ) : provider === 'twitter' ? (
        <TwitterEmbed config={config} url={url} title={title} tokens={tokens} onPress={handlePress} />
      ) : provider === 'github' ? (
        <GitHubEmbed config={config} url={url} title={title} tokens={tokens} onPress={handlePress} />
      ) : provider === 'spotify' ? (
        <SpotifyEmbed config={config} url={url} title={title} tokens={tokens} onPress={handlePress} />
      ) : provider === 'figma' ? (
        <FigmaEmbed config={config} url={url} title={title} tokens={tokens} onPress={handlePress} />
      ) : (
        <GenericEmbed
          config={config}
          url={url}
          title={title}
          description={description}
          imageUrl={imageUrl}
          domain={domain}
          tokens={tokens}
          onPress={handlePress}
          provider={provider}
        />
      )}
    </ComponentWrapper>
  )
}

// ── Provider styles ──────────────────────────────────────────────────────────

function makeProviderStyles(tokens: DesignTokens) {
  return StyleSheet.create({
    card: {
      backgroundColor: tokens.colors.surface,
      borderWidth: 1,
      borderColor: tokens.colors.border,
      borderRadius: tokens.radius.lg,
      overflow: 'hidden',
    },
    body: {
      padding: tokens.spacing[3],
    },
    providerRow: {
      flexDirection: 'row',
      alignItems: 'center',
      marginBottom: tokens.spacing[1],
    },
    providerDot: {
      width: 8,
      height: 8,
      borderRadius: 4,
      marginRight: 6,
    },
    providerLabel: {
      fontSize: tokens.typography.fontSizeXs,
      color: tokens.colors.textMuted,
      fontWeight: tokens.typography.fontWeightMedium,
      flex: 1,
    },
    externalArrow: {
      fontSize: tokens.typography.fontSizeXs,
      marginLeft: 4,
    },
    brandIcon: {
      fontSize: tokens.typography.fontSizeLg,
      fontWeight: tokens.typography.fontWeightBold,
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
      lineHeight: tokens.typography.fontSizeXs * tokens.typography.lineHeightNormal,
    },
    thumbnailContainer: {
      position: 'relative',
    },
    thumbnail16x9: {
      width: '100%',
      height: 180,
    },
    playOverlay: {
      position: 'absolute',
      top: 0,
      right: 0,
      bottom: 0,
      left: 0,
      alignItems: 'center',
      justifyContent: 'center',
      backgroundColor: 'rgba(0,0,0,0.25)',
    },
    playButton: {
      width: 52,
      height: 52,
      borderRadius: 26,
      alignItems: 'center',
      justifyContent: 'center',
    },
    playIcon: {
      fontSize: 20,
      color: '#FFFFFF',
      marginLeft: 2,
    },

    // Twitter
    twitterHeader: {
      flexDirection: 'row',
      alignItems: 'center',
      marginBottom: tokens.spacing[2],
    },
    twitterAvatar: {
      width: 40,
      height: 40,
      borderRadius: 20,
      marginRight: tokens.spacing[2],
    },
    twitterName: {
      fontSize: tokens.typography.fontSizeSm,
      fontWeight: tokens.typography.fontWeightSemibold,
      color: tokens.colors.text,
    },
    twitterHandle: {
      fontSize: tokens.typography.fontSizeXs,
      color: tokens.colors.textMuted,
    },
    tweetText: {
      fontSize: tokens.typography.fontSizeMd,
      color: tokens.colors.text,
      lineHeight: tokens.typography.fontSizeMd * tokens.typography.lineHeightNormal,
      marginBottom: tokens.spacing[2],
    },
    tweetImage: {
      width: '100%',
      height: 200,
      borderRadius: tokens.radius.md,
      marginBottom: tokens.spacing[2],
    },
    metricsRow: {
      flexDirection: 'row',
      gap: tokens.spacing[4],
    },
    metricText: {
      fontSize: tokens.typography.fontSizeXs,
      color: tokens.colors.textMuted,
    },

    // GitHub
    ghRepoName: {
      fontSize: tokens.typography.fontSizeMd,
      fontWeight: tokens.typography.fontWeightSemibold,
      color: tokens.colors.primary,
      marginBottom: tokens.spacing[1],
    },
    ghStatsRow: {
      flexDirection: 'row',
      gap: tokens.spacing[4],
      marginTop: tokens.spacing[2],
    },
    ghStat: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 4,
    },
    ghLangDot: {
      width: 10,
      height: 10,
      borderRadius: 5,
    },
    ghStatIcon: {
      fontSize: tokens.typography.fontSizeSm,
      color: tokens.colors.textMuted,
    },
    ghStatText: {
      fontSize: tokens.typography.fontSizeXs,
      color: tokens.colors.textMuted,
    },

    // Spotify
    spotifyAlbumArt: {
      width: 64,
      height: 64,
      borderRadius: tokens.radius.sm,
    },
  })
}

