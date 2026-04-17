import React from 'react'
import {
  Image,
  Text,
  TouchableOpacity,
  View,
  type ImageStyle,
  type TextStyle,
  type ViewStyle,
} from 'react-native'
import { ComponentWrapper } from '../../_base/ComponentWrapper'
import {
  resolveNativeStyleProps,
  resolveNativeTextStyle,
  resolveSurfacePresentation,
} from '../../_base'
import { useTokens } from '../../../context/AppContext'
import { useScreenContext } from '../../../context/ScreenContext'
import { resolveFromRef } from '../../_base/fromRef'
import type { DesignTokens } from '../../../tokens/types'
import type { LinkEmbedConfig } from './types'
import type { Action, OpenUrlAction } from '../../../actions/types'

type Provider =
  | 'youtube'
  | 'twitter'
  | 'github'
  | 'spotify'
  | 'figma'
  | 'notion'
  | 'linear'
  | 'generic'

const PROVIDER_PATTERNS: [Provider, RegExp][] = [
  ['youtube', /(?:youtube\.com|youtu\.be)/i],
  ['twitter', /(?:twitter\.com|x\.com)/i],
  ['github', /github\.com/i],
  ['spotify', /(?:spotify\.com|open\.spotify)/i],
  ['figma', /figma\.com/i],
  ['notion', /notion\.(?:so|site)/i],
  ['linear', /linear\.app/i],
]

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
  youtube: 'YT',
  twitter: 'X',
  github: 'GH',
  spotify: 'SP',
  figma: 'FG',
  notion: 'NO',
  linear: 'LI',
  generic: '->',
}

interface SharedEmbedProps {
  config: LinkEmbedConfig
  url: string
  title?: string
  description?: string
  imageUrl?: string
  domain: string
  onPress: () => void
  sharedTextStyle: TextStyle
}

function detectProvider(url: string): Provider {
  for (const [provider, pattern] of PROVIDER_PATTERNS) {
    if (pattern.test(url)) {
      return provider
    }
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

function formatNumber(value: number): string {
  if (value >= 1_000_000) {
    return `${(value / 1_000_000).toFixed(1)}M`
  }

  if (value >= 1_000) {
    return `${(value / 1_000).toFixed(1)}K`
  }

  return String(value)
}

function formatDuration(milliseconds: number): string {
  const totalSeconds = Math.floor(milliseconds / 1000)
  const minutes = Math.floor(totalSeconds / 60)
  const seconds = totalSeconds % 60
  return `${minutes}:${String(seconds).padStart(2, '0')}`
}

function providerLabel(provider: Provider, domain: string): string {
  switch (provider) {
    case 'youtube':
      return 'YouTube'
    case 'twitter':
      return 'X'
    case 'github':
      return 'GitHub'
    case 'spotify':
      return 'Spotify'
    case 'figma':
      return 'Figma'
    case 'notion':
      return 'Notion'
    case 'linear':
      return 'Linear'
    default:
      return domain
  }
}

function mergeTextStyle(
  sharedTextStyle: TextStyle,
  surface: ReturnType<typeof resolveSurfacePresentation>,
): TextStyle {
  return {
    ...sharedTextStyle,
    ...(surface.style as TextStyle | undefined),
  }
}

function resolveSlotSurface(
  config: LinkEmbedConfig,
  tokens: DesignTokens,
  slot: string,
  implementationBase?: Record<string, unknown>,
) {
  return resolveSurfacePresentation({
    tokens,
    implementationBase,
    componentSurface:
      (config.slots as Record<string, Record<string, unknown> | undefined> | undefined)?.[slot],
  })
}

function resolveCardSurface(
  config: LinkEmbedConfig,
  tokens: DesignTokens,
  defaultBackground: string,
) {
  const resolvedRootStyle = resolveNativeStyleProps(
    config as Record<string, unknown>,
    tokens,
  )
  const cardBackground =
    typeof resolvedRootStyle.backgroundColor === 'string'
      ? resolvedRootStyle.backgroundColor
      : defaultBackground
  const cardRadius =
    typeof resolvedRootStyle.borderRadius === 'number'
      ? resolvedRootStyle.borderRadius
      : tokens.radius.lg

  return resolveSlotSurface(config, tokens, 'card', {
    backgroundColor: cardBackground,
    borderRadius: cardRadius,
    border: '1 border',
    overflow: 'hidden',
  })
}

function CommonTextSurfaces({
  config,
  sharedTextStyle,
}: {
  config: LinkEmbedConfig
  sharedTextStyle: TextStyle
}) {
  const tokens = useTokens()

  const titleSurface = resolveSlotSurface(config, tokens, 'title', {
    color: 'foreground',
    fontSize: 'sm',
    fontWeight: 'semibold',
    marginBottom: 'xs',
  })
  const descriptionSurface = resolveSlotSurface(config, tokens, 'description', {
    color: 'muted',
    fontSize: 'xs',
  })

  return {
    titleStyle: mergeTextStyle(sharedTextStyle, titleSurface),
    descriptionStyle: mergeTextStyle(sharedTextStyle, descriptionSurface),
  }
}

function ProviderRow({
  config,
  provider,
  sharedTextStyle,
  domain,
  showExternalArrow = false,
}: {
  config: LinkEmbedConfig
  provider: Provider
  sharedTextStyle: TextStyle
  domain: string
  showExternalArrow?: boolean
}) {
  const tokens = useTokens()
  const providerRowSurface = resolveSlotSurface(config, tokens, 'providerRow', {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 'xs',
  })
  const providerDotSurface = resolveSlotSurface(config, tokens, 'providerDot', {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: BRAND_COLORS[provider],
    marginRight: 6,
  })
  const providerLabelSurface = resolveSlotSurface(config, tokens, 'providerLabel', {
    color: 'muted',
    fontSize: 'xs',
    fontWeight: 'medium',
    flex: 1,
  })
  const externalArrowSurface = resolveSlotSurface(config, tokens, 'externalArrow', {
    color: 'muted',
    fontSize: 'xs',
    marginLeft: 4,
  })

  return (
    <View style={providerRowSurface.style as ViewStyle | undefined}>
      <View style={providerDotSurface.style as ViewStyle | undefined} />
      <Text style={mergeTextStyle(sharedTextStyle, providerLabelSurface)}>
        {providerLabel(provider, domain)}
      </Text>
      {showExternalArrow ? (
        <Text style={mergeTextStyle(sharedTextStyle, externalArrowSurface)}>{'->'}</Text>
      ) : null}
    </View>
  )
}

function Thumbnail({
  config,
  source,
  accessibilityLabel,
  overlay,
}: {
  config: LinkEmbedConfig
  source?: string
  accessibilityLabel: string
  overlay?: React.ReactNode
}) {
  const tokens = useTokens()

  if (source == null) {
    return null
  }

  const thumbnailContainerSurface = resolveSlotSurface(config, tokens, 'thumbnailContainer', {
    position: 'relative',
  })
  const thumbnailImageSurface = resolveSlotSurface(config, tokens, 'thumbnailImage', {
    width: '100%',
    height: 180,
  })

  return (
    <View style={thumbnailContainerSurface.style as ViewStyle | undefined}>
      <Image
        source={{ uri: source }}
        style={thumbnailImageSurface.style as ImageStyle | undefined}
        resizeMode="cover"
        accessibilityLabel={accessibilityLabel}
      />
      {overlay}
    </View>
  )
}

function YouTubeEmbed({
  config,
  url,
  title,
  description,
  imageUrl,
  onPress,
  sharedTextStyle,
}: SharedEmbedProps) {
  const tokens = useTokens()
  const cardSurface = resolveCardSurface(config, tokens, tokens.colors.surface)
  const bodySurface = resolveSlotSurface(config, tokens, 'body', {
    padding: 'md',
  })
  const playOverlaySurface = resolveSlotSurface(config, tokens, 'playOverlay', {
    position: 'absolute',
    inset: 0,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(0,0,0,0.25)',
  })
  const playButtonSurface = resolveSlotSurface(config, tokens, 'playButton', {
    width: 52,
    height: 52,
    borderRadius: 'full',
    backgroundColor: BRAND_COLORS.youtube,
    alignItems: 'center',
    justifyContent: 'center',
  })
  const playIconSurface = resolveSlotSurface(config, tokens, 'playIcon', {
    color: '#FFFFFF',
    fontSize: 'sm',
    fontWeight: 'bold',
  })
  const { titleStyle, descriptionStyle } = CommonTextSurfaces({
    config,
    sharedTextStyle,
  })

  const videoId = config.videoId ?? extractYouTubeId(url)
  const thumbnailUrl =
    videoId != null ? `https://img.youtube.com/vi/${videoId}/hqdefault.jpg` : imageUrl

  return (
    <TouchableOpacity
      onPress={onPress}
      style={cardSurface.style as ViewStyle | undefined}
      activeOpacity={0.85}
      accessibilityRole="link"
      accessibilityLabel={title ?? 'YouTube video'}
      testID={config.testID ?? config.id}
    >
      <Thumbnail
        config={config}
        source={thumbnailUrl}
        accessibilityLabel={title ?? 'YouTube preview'}
        overlay={
          <View style={playOverlaySurface.style as ViewStyle | undefined}>
            <View style={playButtonSurface.style as ViewStyle | undefined}>
              <Text style={mergeTextStyle(sharedTextStyle, playIconSurface)}>{'>'}</Text>
            </View>
          </View>
        }
      />
      <View style={bodySurface.style as ViewStyle | undefined}>
        <ProviderRow
          config={config}
          provider="youtube"
          sharedTextStyle={sharedTextStyle}
          domain="youtube.com"
        />
        {title != null ? (
          <Text style={titleStyle} numberOfLines={2}>
            {title}
          </Text>
        ) : null}
        {description != null ? (
          <Text style={descriptionStyle} numberOfLines={2}>
            {description}
          </Text>
        ) : null}
      </View>
    </TouchableOpacity>
  )
}

function TwitterEmbed({
  config,
  title,
  imageUrl,
  onPress,
  sharedTextStyle,
}: SharedEmbedProps) {
  const tokens = useTokens()
  const cardSurface = resolveCardSurface(config, tokens, tokens.colors.surface)
  const bodySurface = resolveSlotSurface(config, tokens, 'body', {
    padding: 'md',
  })
  const twitterHeaderSurface = resolveSlotSurface(config, tokens, 'twitterHeader', {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 'sm',
  })
  const twitterAvatarSurface = resolveSlotSurface(config, tokens, 'twitterAvatar', {
    width: 40,
    height: 40,
    borderRadius: 'full',
    marginRight: 'sm',
  })
  const twitterNameSurface = resolveSlotSurface(config, tokens, 'twitterName', {
    color: 'foreground',
    fontSize: 'sm',
    fontWeight: 'semibold',
  })
  const twitterHandleSurface = resolveSlotSurface(config, tokens, 'twitterHandle', {
    color: 'muted',
    fontSize: 'xs',
  })
  const brandIconSurface = resolveSlotSurface(config, tokens, 'brandIcon', {
    color: BRAND_COLORS.twitter,
    fontSize: 'sm',
    fontWeight: 'bold',
  })
  const tweetTextSurface = resolveSlotSurface(config, tokens, 'tweetText', {
    color: 'foreground',
    fontSize: 'base',
    marginBottom: 'sm',
  })
  const tweetImageSurface = resolveSlotSurface(config, tokens, 'tweetImage', {
    width: '100%',
    height: 200,
    borderRadius: 'md',
    marginBottom: 'sm',
  })
  const metricsRowSurface = resolveSlotSurface(config, tokens, 'metricsRow', {
    flexDirection: 'row',
    gap: 'lg',
  })
  const metricTextSurface = resolveSlotSurface(config, tokens, 'metricText', {
    color: 'muted',
    fontSize: 'xs',
  })

  return (
    <TouchableOpacity
      onPress={onPress}
      style={cardSurface.style as ViewStyle | undefined}
      activeOpacity={0.85}
      accessibilityRole="link"
      accessibilityLabel={config.tweetText ?? title ?? 'Post'}
      testID={config.testID ?? config.id}
    >
      <View style={bodySurface.style as ViewStyle | undefined}>
        <View style={twitterHeaderSurface.style as ViewStyle | undefined}>
          {config.authorAvatarUrl != null ? (
            <Image
              source={{ uri: config.authorAvatarUrl }}
              style={twitterAvatarSurface.style as ImageStyle | undefined}
              resizeMode="cover"
              accessibilityLabel={config.authorName ?? 'Author avatar'}
            />
          ) : (
            <View
              style={[
                twitterAvatarSurface.style as ViewStyle | undefined,
                {
                  backgroundColor: tokens.colors.surfaceAlt,
                  alignItems: 'center',
                  justifyContent: 'center',
                },
              ]}
            >
              <Text style={mergeTextStyle(sharedTextStyle, brandIconSurface)}>
                {config.authorName?.[0]?.toUpperCase() ?? '?'}
              </Text>
            </View>
          )}
          <View style={{ flex: 1 }}>
            <Text style={mergeTextStyle(sharedTextStyle, twitterNameSurface)} numberOfLines={1}>
              {config.authorName ?? 'Unknown'}
            </Text>
            {config.authorHandle != null ? (
              <Text
                style={mergeTextStyle(sharedTextStyle, twitterHandleSurface)}
                numberOfLines={1}
              >
                @{config.authorHandle}
              </Text>
            ) : null}
          </View>
          <Text style={mergeTextStyle(sharedTextStyle, brandIconSurface)}>X</Text>
        </View>

        {config.tweetText != null ? (
          <Text style={mergeTextStyle(sharedTextStyle, tweetTextSurface)} numberOfLines={4}>
            {config.tweetText}
          </Text>
        ) : null}

        {imageUrl != null ? (
          <Image
            source={{ uri: imageUrl }}
            style={tweetImageSurface.style as ImageStyle | undefined}
            resizeMode="cover"
            accessibilityLabel="Embedded image"
          />
        ) : null}

        {config.metrics != null ? (
          <View style={metricsRowSurface.style as ViewStyle | undefined}>
            {config.metrics.replies != null ? (
              <Text style={mergeTextStyle(sharedTextStyle, metricTextSurface)}>
                {`Replies ${formatNumber(config.metrics.replies)}`}
              </Text>
            ) : null}
            {config.metrics.retweets != null ? (
              <Text style={mergeTextStyle(sharedTextStyle, metricTextSurface)}>
                {`Reposts ${formatNumber(config.metrics.retweets)}`}
              </Text>
            ) : null}
            {config.metrics.likes != null ? (
              <Text style={mergeTextStyle(sharedTextStyle, metricTextSurface)}>
                {`Likes ${formatNumber(config.metrics.likes)}`}
              </Text>
            ) : null}
          </View>
        ) : null}
      </View>
    </TouchableOpacity>
  )
}

function GitHubEmbed({
  config,
  url,
  title,
  description,
  onPress,
  sharedTextStyle,
}: SharedEmbedProps) {
  const tokens = useTokens()
  const cardSurface = resolveCardSurface(config, tokens, tokens.colors.surface)
  const bodySurface = resolveSlotSurface(config, tokens, 'body', {
    padding: 'md',
  })
  const repoNameSurface = resolveSlotSurface(config, tokens, 'ghRepoName', {
    color: 'primary',
    fontSize: 'base',
    fontWeight: 'semibold',
    marginBottom: 'xs',
  })
  const ghStatsRowSurface = resolveSlotSurface(config, tokens, 'ghStatsRow', {
    flexDirection: 'row',
    gap: 'lg',
    marginTop: 'sm',
  })
  const ghStatSurface = resolveSlotSurface(config, tokens, 'ghStat', {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  })
  const ghLangDotSurface = resolveSlotSurface(config, tokens, 'ghLangDot', {
    width: 10,
    height: 10,
    borderRadius: 'full',
    backgroundColor: config.languageColor ?? tokens.colors.primary,
  })
  const ghStatIconSurface = resolveSlotSurface(config, tokens, 'ghStatIcon', {
    color: 'muted',
    fontSize: 'sm',
  })
  const ghStatTextSurface = resolveSlotSurface(config, tokens, 'ghStatText', {
    color: 'muted',
    fontSize: 'xs',
  })
  const { descriptionStyle } = CommonTextSurfaces({
    config,
    sharedTextStyle,
  })

  const urlParts = url.match(/github\.com\/([^/]+)\/([^/]+)/)
  const owner = config.repoOwner ?? urlParts?.[1]
  const repo = config.repoName ?? urlParts?.[2]?.replace(/\.git$/, '')
  const repoDisplay =
    owner != null && repo != null ? `${owner} / ${repo}` : title ?? url

  return (
    <TouchableOpacity
      onPress={onPress}
      style={cardSurface.style as ViewStyle | undefined}
      activeOpacity={0.85}
      accessibilityRole="link"
      accessibilityLabel={repoDisplay}
      testID={config.testID ?? config.id}
    >
      <View style={bodySurface.style as ViewStyle | undefined}>
        <ProviderRow
          config={config}
          provider="github"
          sharedTextStyle={sharedTextStyle}
          domain="github.com"
        />
        <Text style={mergeTextStyle(sharedTextStyle, repoNameSurface)} numberOfLines={1}>
          {repoDisplay}
        </Text>
        {(config.repoDescription ?? description) != null ? (
          <Text style={descriptionStyle} numberOfLines={3}>
            {config.repoDescription ?? description}
          </Text>
        ) : null}
        <View style={ghStatsRowSurface.style as ViewStyle | undefined}>
          {config.language != null ? (
            <View style={ghStatSurface.style as ViewStyle | undefined}>
              <View style={ghLangDotSurface.style as ViewStyle | undefined} />
              <Text style={mergeTextStyle(sharedTextStyle, ghStatTextSurface)}>
                {config.language}
              </Text>
            </View>
          ) : null}
          {config.stars != null ? (
            <View style={ghStatSurface.style as ViewStyle | undefined}>
              <Text style={mergeTextStyle(sharedTextStyle, ghStatIconSurface)}>*</Text>
              <Text style={mergeTextStyle(sharedTextStyle, ghStatTextSurface)}>
                {formatNumber(config.stars)}
              </Text>
            </View>
          ) : null}
          {config.forks != null ? (
            <View style={ghStatSurface.style as ViewStyle | undefined}>
              <Text style={mergeTextStyle(sharedTextStyle, ghStatIconSurface)}>F</Text>
              <Text style={mergeTextStyle(sharedTextStyle, ghStatTextSurface)}>
                {formatNumber(config.forks)}
              </Text>
            </View>
          ) : null}
        </View>
      </View>
    </TouchableOpacity>
  )
}

function SpotifyEmbed({
  config,
  title,
  onPress,
  sharedTextStyle,
}: SharedEmbedProps) {
  const tokens = useTokens()
  const cardSurface = resolveCardSurface(config, tokens, '#191414')
  const bodySurface = resolveSlotSurface(config, tokens, 'body', {
    padding: 'md',
    flexDirection: 'row',
    alignItems: 'center',
  })
  const spotifyAlbumArtSurface = resolveSlotSurface(config, tokens, 'spotifyAlbumArt', {
    width: 64,
    height: 64,
    borderRadius: 'sm',
  })
  const playButtonSurface = resolveSlotSurface(config, tokens, 'playButton', {
    width: 40,
    height: 40,
    borderRadius: 'full',
    backgroundColor: BRAND_COLORS.spotify,
    alignItems: 'center',
    justifyContent: 'center',
  })
  const playIconSurface = resolveSlotSurface(config, tokens, 'playIcon', {
    color: '#FFFFFF',
    fontSize: 'sm',
    fontWeight: 'bold',
  })
  const titleSurface = resolveSlotSurface(config, tokens, 'title', {
    color: '#FFFFFF',
    fontSize: 'sm',
    fontWeight: 'semibold',
  })
  const descriptionSurface = resolveSlotSurface(config, tokens, 'description', {
    color: '#B3B3B3',
    fontSize: 'xs',
  })
  const metricTextSurface = resolveSlotSurface(config, tokens, 'metricText', {
    color: '#686868',
    fontSize: 'xs',
    marginTop: 4,
  })

  return (
    <TouchableOpacity
      onPress={onPress}
      style={cardSurface.style as ViewStyle | undefined}
      activeOpacity={0.85}
      accessibilityRole="link"
      accessibilityLabel={config.trackName ?? title ?? 'Spotify track'}
      testID={config.testID ?? config.id}
    >
      <View style={bodySurface.style as ViewStyle | undefined}>
        {config.albumArtUrl != null ? (
          <Image
            source={{ uri: config.albumArtUrl }}
            style={spotifyAlbumArtSurface.style as ImageStyle | undefined}
            resizeMode="cover"
            accessibilityLabel="Album art"
          />
        ) : null}
        <View style={{ flex: 1, marginLeft: config.albumArtUrl != null ? 12 : 0 }}>
          <ProviderRow
            config={config}
            provider="spotify"
            sharedTextStyle={sharedTextStyle}
            domain="spotify.com"
          />
          <Text style={mergeTextStyle(sharedTextStyle, titleSurface)} numberOfLines={1}>
            {config.trackName ?? title ?? 'Untitled track'}
          </Text>
          {config.artistName != null ? (
            <Text style={mergeTextStyle(sharedTextStyle, descriptionSurface)} numberOfLines={1}>
              {config.artistName}
            </Text>
          ) : null}
          {config.durationMs != null ? (
            <Text style={mergeTextStyle(sharedTextStyle, metricTextSurface)}>
              {formatDuration(config.durationMs)}
            </Text>
          ) : null}
        </View>
        <View style={playButtonSurface.style as ViewStyle | undefined}>
          <Text style={mergeTextStyle(sharedTextStyle, playIconSurface)}>{'>'}</Text>
        </View>
      </View>
    </TouchableOpacity>
  )
}

function FigmaEmbed({
  config,
  title,
  imageUrl,
  onPress,
  sharedTextStyle,
}: SharedEmbedProps) {
  const tokens = useTokens()
  const cardSurface = resolveCardSurface(config, tokens, tokens.colors.surface)
  const bodySurface = resolveSlotSurface(config, tokens, 'body', {
    padding: 'md',
  })
  const { titleStyle, descriptionStyle } = CommonTextSurfaces({
    config,
    sharedTextStyle,
  })

  return (
    <TouchableOpacity
      onPress={onPress}
      style={cardSurface.style as ViewStyle | undefined}
      activeOpacity={0.85}
      accessibilityRole="link"
      accessibilityLabel={config.fileName ?? title ?? 'Figma file'}
      testID={config.testID ?? config.id}
    >
      <Thumbnail
        config={config}
        source={config.thumbnailUrl ?? imageUrl}
        accessibilityLabel="Figma preview"
      />
      <View style={bodySurface.style as ViewStyle | undefined}>
        <ProviderRow
          config={config}
          provider="figma"
          sharedTextStyle={sharedTextStyle}
          domain="figma.com"
        />
        <Text style={titleStyle} numberOfLines={2}>
          {config.fileName ?? title ?? 'Untitled'}
        </Text>
        {config.lastModified != null ? (
          <Text style={descriptionStyle}>{`Last modified: ${config.lastModified}`}</Text>
        ) : null}
      </View>
    </TouchableOpacity>
  )
}

function GenericEmbed({
  config,
  provider,
  title,
  description,
  imageUrl,
  domain,
  onPress,
  sharedTextStyle,
}: SharedEmbedProps & { provider: Provider }) {
  const tokens = useTokens()
  const cardSurface = resolveCardSurface(config, tokens, tokens.colors.surface)
  const bodySurface = resolveSlotSurface(config, tokens, 'body', {
    padding: 'md',
  })
  const brandIconSurface = resolveSlotSurface(config, tokens, 'brandIcon', {
    color: BRAND_COLORS[provider],
    fontSize: 'xs',
    fontWeight: 'bold',
    marginRight: 6,
  })
  const providerRowSurface = resolveSlotSurface(config, tokens, 'providerRow', {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 'xs',
  })
  const providerLabelSurface = resolveSlotSurface(config, tokens, 'providerLabel', {
    color: 'muted',
    fontSize: 'xs',
    fontWeight: 'medium',
    flex: 1,
  })
  const externalArrowSurface = resolveSlotSurface(config, tokens, 'externalArrow', {
    color: 'muted',
    fontSize: 'xs',
    marginLeft: 4,
  })
  const { titleStyle, descriptionStyle } = CommonTextSurfaces({
    config,
    sharedTextStyle,
  })

  const knownProvider = provider !== 'generic'

  return (
    <TouchableOpacity
      onPress={onPress}
      style={cardSurface.style as ViewStyle | undefined}
      activeOpacity={0.85}
      accessibilityRole="link"
      accessibilityLabel={title ?? domain ?? 'Open link'}
      accessibilityHint={description ?? `Opens ${domain}`}
      testID={config.testID ?? config.id}
    >
      <Thumbnail
        config={config}
        source={imageUrl}
        accessibilityLabel={title ?? domain ?? 'Link preview'}
      />
      <View style={bodySurface.style as ViewStyle | undefined}>
        <View style={providerRowSurface.style as ViewStyle | undefined}>
          {knownProvider ? (
            <Text style={mergeTextStyle(sharedTextStyle, brandIconSurface)}>
              {BRAND_ICONS[provider]}
            </Text>
          ) : config.favicon != null && !/^https?:\/\//.test(config.favicon) ? (
            <Text style={mergeTextStyle(sharedTextStyle, brandIconSurface)}>
              {config.favicon}
            </Text>
          ) : config.favicon != null ? (
            <Image
              source={{ uri: config.favicon }}
              style={{ width: 14, height: 14, borderRadius: 2, marginRight: 6 }}
              resizeMode="contain"
              accessibilityLabel=""
            />
          ) : null}
          <Text style={mergeTextStyle(sharedTextStyle, providerLabelSurface)}>
            {providerLabel(provider, domain)}
          </Text>
          <Text style={mergeTextStyle(sharedTextStyle, externalArrowSurface)}>{'->'}</Text>
        </View>
        {title != null ? (
          <Text style={titleStyle} numberOfLines={2}>
            {title}
          </Text>
        ) : null}
        {description != null ? (
          <Text style={descriptionStyle} numberOfLines={2}>
            {description}
          </Text>
        ) : null}
      </View>
    </TouchableOpacity>
  )
}

export function LinkEmbed({ config }: { config: LinkEmbedConfig }) {
  const tokens = useTokens()
  const { values, dispatch } = useScreenContext()

  const sharedTextStyle = resolveNativeTextStyle(config as Record<string, unknown>, tokens)
  const url = String(resolveFromRef(config.url, values) ?? '')
  const title =
    config.title != null ? String(resolveFromRef(config.title, values) ?? '') : undefined
  const description =
    config.description != null
      ? String(resolveFromRef(config.description, values) ?? '')
      : undefined
  const imageUrl =
    config.imageUrl != null ? String(resolveFromRef(config.imageUrl, values) ?? '') : undefined
  const domain =
    config.domain != null
      ? String(resolveFromRef(config.domain, values) ?? '')
      : getDomain(url)
  const provider: Provider = config.provider ?? detectProvider(url)

  const handlePress = React.useMemo(() => {
    const action: Action =
      config.onPress ?? ({ type: 'open-url', url } as OpenUrlAction)

    return () => void dispatch(action)
  }, [config.onPress, dispatch, url])

  return (
    <ComponentWrapper id={config.id} testID={config.testID} config={config}>
      {provider === 'youtube' ? (
        <YouTubeEmbed
          config={config}
          url={url}
          title={title}
          description={description}
          imageUrl={imageUrl}
          domain={domain}
          onPress={handlePress}
          sharedTextStyle={sharedTextStyle}
        />
      ) : provider === 'twitter' ? (
        <TwitterEmbed
          config={config}
          url={url}
          title={title}
          description={description}
          imageUrl={imageUrl}
          domain={domain}
          onPress={handlePress}
          sharedTextStyle={sharedTextStyle}
        />
      ) : provider === 'github' ? (
        <GitHubEmbed
          config={config}
          url={url}
          title={title}
          description={description}
          imageUrl={imageUrl}
          domain={domain}
          onPress={handlePress}
          sharedTextStyle={sharedTextStyle}
        />
      ) : provider === 'spotify' ? (
        <SpotifyEmbed
          config={config}
          url={url}
          title={title}
          description={description}
          imageUrl={imageUrl}
          domain={domain}
          onPress={handlePress}
          sharedTextStyle={sharedTextStyle}
        />
      ) : provider === 'figma' ? (
        <FigmaEmbed
          config={config}
          url={url}
          title={title}
          description={description}
          imageUrl={imageUrl}
          domain={domain}
          onPress={handlePress}
          sharedTextStyle={sharedTextStyle}
        />
      ) : (
        <GenericEmbed
          config={config}
          url={url}
          title={title}
          description={description}
          imageUrl={imageUrl}
          domain={domain}
          onPress={handlePress}
          sharedTextStyle={sharedTextStyle}
          provider={provider}
        />
      )}
    </ComponentWrapper>
  )
}
