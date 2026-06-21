import React from 'react'
import {
  Image,
  Text,
  TouchableOpacity,
  View,
  Linking,
  type ImageStyle,
  type TextStyle,
  type ViewStyle,
} from 'react-native'
import { resolveNativeTextStyle } from '../../_base/text-style'
import { resolveSurfacePresentation } from '../../_base/style-surfaces'
import { useTokens } from '../../../context/AppContext'
import type { DesignTokens } from '../../../tokens/types'

export type LinkEmbedProvider =
  | 'youtube'
  | 'twitter'
  | 'github'
  | 'spotify'
  | 'figma'
  | 'notion'
  | 'linear'
  | 'generic'

const PROVIDER_PATTERNS: [LinkEmbedProvider, RegExp][] = [
  ['youtube', /(?:youtube\.com|youtu\.be)/i],
  ['twitter', /(?:twitter\.com|x\.com)/i],
  ['github', /github\.com/i],
  ['spotify', /(?:spotify\.com|open\.spotify)/i],
  ['figma', /figma\.com/i],
  ['notion', /notion\.(?:so|site)/i],
  ['linear', /linear\.app/i],
]

const BRAND_COLORS: Record<LinkEmbedProvider, string> = {
  youtube: '#FF0000',
  twitter: '#1DA1F2',
  github: '#24292e',
  spotify: '#1DB954',
  figma: '#A259FF',
  notion: '#000000',
  linear: '#5E6AD2',
  generic: '#6B7280',
}

const BRAND_ICONS: Record<LinkEmbedProvider, string> = {
  youtube: 'YT',
  twitter: 'X',
  github: 'GH',
  spotify: 'SP',
  figma: 'FG',
  notion: 'NO',
  linear: 'LI',
  generic: '->',
}

export interface LinkEmbedTwitterMetrics {
  likes?: number
  retweets?: number
  replies?: number
}

export interface LinkEmbedBaseProps {
  /** URL the embed represents. */
  url: string
  /** Optional title shown on the card. */
  title?: string
  /** Optional description shown on the card. */
  description?: string
  /** Hero image URL. */
  imageUrl?: string
  /** Favicon (URL or 1-2 char string). */
  favicon?: string
  /** Override the displayed domain (defaults to host of URL). */
  domain?: string
  /** Override auto-detected provider. */
  provider?: LinkEmbedProvider
  /** Press handler — defaults to opening the URL with Linking. */
  onPress?: () => void

  // YouTube
  videoId?: string

  // Twitter
  authorName?: string
  authorHandle?: string
  authorAvatarUrl?: string
  tweetText?: string
  metrics?: LinkEmbedTwitterMetrics

  // GitHub
  repoOwner?: string
  repoName?: string
  repoDescription?: string
  language?: string
  languageColor?: string
  stars?: number
  forks?: number

  // Spotify
  trackName?: string
  artistName?: string
  albumArtUrl?: string
  durationMs?: number

  // Figma
  fileName?: string
  lastModified?: string
  thumbnailUrl?: string

  /** Style applied to root card. */
  style?: ViewStyle
  /** Slot overrides keyed by slot name. */
  slots?: Record<string, Record<string, unknown>>
  testID?: string
  id?: string
}

function detectProvider(url: string): LinkEmbedProvider {
  for (const [provider, pattern] of PROVIDER_PATTERNS) {
    if (pattern.test(url)) {
      return provider
    }
  }

  return 'generic'
}

function extractYouTubeId(url: string): string | null {
  const match = url.match(/(?:v=|youtu\.be\/)([a-zA-Z0-9_-]{11})/)
  return match ? match[1]! : null
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

function providerLabel(provider: LinkEmbedProvider, domain: string): string {
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

function resolveSlot(
  slots: Record<string, Record<string, unknown> | undefined> | undefined,
  tokens: DesignTokens,
  slot: string,
  implementationBase?: Record<string, unknown>,
) {
  return resolveSurfacePresentation({
    tokens,
    implementationBase,
    componentSurface: slots?.[slot],
  })
}

function resolveCardSurface(
  slots: Record<string, Record<string, unknown> | undefined> | undefined,
  tokens: DesignTokens,
  defaultBackground: string,
) {
  return resolveSlot(slots, tokens, 'card', {
    backgroundColor: defaultBackground,
    borderRadius: tokens.radius.lg,
    border: '1 border',
    overflow: 'hidden',
  })
}

function CommonTextSurfaces({
  slots,
  sharedTextStyle,
}: {
  slots: Record<string, Record<string, unknown>> | undefined
  sharedTextStyle: TextStyle
}) {
  const tokens = useTokens()

  const titleSurface = resolveSlot(slots, tokens, 'title', {
    color: 'foreground',
    fontSize: 'sm',
    fontWeight: 'semibold',
    marginBottom: 'xs',
  })
  const descriptionSurface = resolveSlot(slots, tokens, 'description', {
    color: 'muted',
    fontSize: 'xs',
  })

  return {
    titleStyle: mergeTextStyle(sharedTextStyle, titleSurface),
    descriptionStyle: mergeTextStyle(sharedTextStyle, descriptionSurface),
  }
}

function ProviderRow({
  slots,
  provider,
  sharedTextStyle,
  domain,
  showExternalArrow = false,
}: {
  slots: Record<string, Record<string, unknown>> | undefined
  provider: LinkEmbedProvider
  sharedTextStyle: TextStyle
  domain: string
  showExternalArrow?: boolean
}) {
  const tokens = useTokens()
  const providerRowSurface = resolveSlot(slots, tokens, 'providerRow', {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 'xs',
  })
  const providerDotSurface = resolveSlot(slots, tokens, 'providerDot', {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: BRAND_COLORS[provider],
    marginRight: 6,
  })
  const providerLabelSurface = resolveSlot(slots, tokens, 'providerLabel', {
    color: 'muted',
    fontSize: 'xs',
    fontWeight: 'medium',
    flex: 1,
  })
  const externalArrowSurface = resolveSlot(slots, tokens, 'externalArrow', {
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
  slots,
  source,
  accessibilityLabel,
  overlay,
}: {
  slots: Record<string, Record<string, unknown>> | undefined
  source?: string
  accessibilityLabel: string
  overlay?: React.ReactNode
}) {
  const tokens = useTokens()

  if (source == null) {
    return null
  }

  const thumbnailContainerSurface = resolveSlot(slots, tokens, 'thumbnailContainer', {
    position: 'relative',
  })
  const thumbnailImageSurface = resolveSlot(slots, tokens, 'thumbnailImage', {
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

function YouTubeEmbed(props: LinkEmbedBaseProps & { provider: LinkEmbedProvider; domain: string; onPress: () => void; sharedTextStyle: TextStyle; cardStyle?: ViewStyle }) {
  const tokens = useTokens()
  const { slots, url, title, description, imageUrl, videoId, onPress, sharedTextStyle, testID, id, cardStyle } = props
  const cardSurface = resolveCardSurface(slots, tokens, tokens.colors.surface)
  const bodySurface = resolveSlot(slots, tokens, 'body', {
    padding: 'md',
  })
  const playOverlaySurface = resolveSlot(slots, tokens, 'playOverlay', {
    position: 'absolute',
    inset: 0,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(0,0,0,0.25)',
  })
  const playButtonSurface = resolveSlot(slots, tokens, 'playButton', {
    width: 52,
    height: 52,
    borderRadius: 'full',
    backgroundColor: BRAND_COLORS.youtube,
    alignItems: 'center',
    justifyContent: 'center',
  })
  const playIconSurface = resolveSlot(slots, tokens, 'playIcon', {
    color: '#FFFFFF',
    fontSize: 'sm',
    fontWeight: 'bold',
  })
  const { titleStyle, descriptionStyle } = CommonTextSurfaces({ slots, sharedTextStyle })

  const resolvedVideoId = videoId ?? extractYouTubeId(url)
  const thumbnailUrl =
    resolvedVideoId != null ? `https://img.youtube.com/vi/${resolvedVideoId}/hqdefault.jpg` : imageUrl

  return (
    <TouchableOpacity
      onPress={onPress}
      style={[cardSurface.style as ViewStyle | undefined, cardStyle]}
      activeOpacity={0.85}
      accessibilityRole="link"
      accessibilityLabel={title ?? 'YouTube video'}
      testID={testID ?? id}
    >
      <Thumbnail
        slots={slots}
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
          slots={slots}
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

function TwitterEmbed(props: LinkEmbedBaseProps & { provider: LinkEmbedProvider; domain: string; onPress: () => void; sharedTextStyle: TextStyle; cardStyle?: ViewStyle }) {
  const tokens = useTokens()
  const {
    slots,
    title,
    imageUrl,
    onPress,
    sharedTextStyle,
    authorName,
    authorHandle,
    authorAvatarUrl,
    tweetText,
    metrics,
    testID,
    id,
    cardStyle,
  } = props
  const cardSurface = resolveCardSurface(slots, tokens, tokens.colors.surface)
  const bodySurface = resolveSlot(slots, tokens, 'body', {
    padding: 'md',
  })
  const twitterHeaderSurface = resolveSlot(slots, tokens, 'twitterHeader', {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 'sm',
  })
  const twitterAvatarSurface = resolveSlot(slots, tokens, 'twitterAvatar', {
    width: 40,
    height: 40,
    borderRadius: 'full',
    marginRight: 'sm',
  })
  const twitterNameSurface = resolveSlot(slots, tokens, 'twitterName', {
    color: 'foreground',
    fontSize: 'sm',
    fontWeight: 'semibold',
  })
  const twitterHandleSurface = resolveSlot(slots, tokens, 'twitterHandle', {
    color: 'muted',
    fontSize: 'xs',
  })
  const brandIconSurface = resolveSlot(slots, tokens, 'brandIcon', {
    color: BRAND_COLORS.twitter,
    fontSize: 'sm',
    fontWeight: 'bold',
  })
  const tweetTextSurface = resolveSlot(slots, tokens, 'tweetText', {
    color: 'foreground',
    fontSize: 'base',
    marginBottom: 'sm',
  })
  const tweetImageSurface = resolveSlot(slots, tokens, 'tweetImage', {
    width: '100%',
    height: 200,
    borderRadius: 'md',
    marginBottom: 'sm',
  })
  const metricsRowSurface = resolveSlot(slots, tokens, 'metricsRow', {
    flexDirection: 'row',
    gap: 'lg',
  })
  const metricTextSurface = resolveSlot(slots, tokens, 'metricText', {
    color: 'muted',
    fontSize: 'xs',
  })

  return (
    <TouchableOpacity
      onPress={onPress}
      style={[cardSurface.style as ViewStyle | undefined, cardStyle]}
      activeOpacity={0.85}
      accessibilityRole="link"
      accessibilityLabel={tweetText ?? title ?? 'Post'}
      testID={testID ?? id}
    >
      <View style={bodySurface.style as ViewStyle | undefined}>
        <View style={twitterHeaderSurface.style as ViewStyle | undefined}>
          {authorAvatarUrl != null ? (
            <Image
              source={{ uri: authorAvatarUrl }}
              style={twitterAvatarSurface.style as ImageStyle | undefined}
              resizeMode="cover"
              accessibilityLabel={authorName ?? 'Author avatar'}
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
                {authorName?.[0]?.toUpperCase() ?? '?'}
              </Text>
            </View>
          )}
          <View style={{ flex: 1 }}>
            <Text style={mergeTextStyle(sharedTextStyle, twitterNameSurface)} numberOfLines={1}>
              {authorName ?? 'Unknown'}
            </Text>
            {authorHandle != null ? (
              <Text
                style={mergeTextStyle(sharedTextStyle, twitterHandleSurface)}
                numberOfLines={1}
              >
                @{authorHandle}
              </Text>
            ) : null}
          </View>
          <Text style={mergeTextStyle(sharedTextStyle, brandIconSurface)}>X</Text>
        </View>

        {tweetText != null ? (
          <Text style={mergeTextStyle(sharedTextStyle, tweetTextSurface)} numberOfLines={4}>
            {tweetText}
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

        {metrics != null ? (
          <View style={metricsRowSurface.style as ViewStyle | undefined}>
            {metrics.replies != null ? (
              <Text style={mergeTextStyle(sharedTextStyle, metricTextSurface)}>
                {`Replies ${formatNumber(metrics.replies)}`}
              </Text>
            ) : null}
            {metrics.retweets != null ? (
              <Text style={mergeTextStyle(sharedTextStyle, metricTextSurface)}>
                {`Reposts ${formatNumber(metrics.retweets)}`}
              </Text>
            ) : null}
            {metrics.likes != null ? (
              <Text style={mergeTextStyle(sharedTextStyle, metricTextSurface)}>
                {`Likes ${formatNumber(metrics.likes)}`}
              </Text>
            ) : null}
          </View>
        ) : null}
      </View>
    </TouchableOpacity>
  )
}

function GitHubEmbed(props: LinkEmbedBaseProps & { provider: LinkEmbedProvider; domain: string; onPress: () => void; sharedTextStyle: TextStyle; cardStyle?: ViewStyle }) {
  const tokens = useTokens()
  const {
    slots,
    url,
    title,
    description,
    onPress,
    sharedTextStyle,
    repoOwner,
    repoName,
    repoDescription,
    language,
    languageColor,
    stars,
    forks,
    testID,
    id,
    cardStyle,
  } = props
  const cardSurface = resolveCardSurface(slots, tokens, tokens.colors.surface)
  const bodySurface = resolveSlot(slots, tokens, 'body', {
    padding: 'md',
  })
  const repoNameSurface = resolveSlot(slots, tokens, 'ghRepoName', {
    color: 'primary',
    fontSize: 'base',
    fontWeight: 'semibold',
    marginBottom: 'xs',
  })
  const ghStatsRowSurface = resolveSlot(slots, tokens, 'ghStatsRow', {
    flexDirection: 'row',
    gap: 'lg',
    marginTop: 'sm',
  })
  const ghStatSurface = resolveSlot(slots, tokens, 'ghStat', {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  })
  const ghLangDotSurface = resolveSlot(slots, tokens, 'ghLangDot', {
    width: 10,
    height: 10,
    borderRadius: 'full',
    backgroundColor: languageColor ?? tokens.colors.primary,
  })
  const ghStatIconSurface = resolveSlot(slots, tokens, 'ghStatIcon', {
    color: 'muted',
    fontSize: 'sm',
  })
  const ghStatTextSurface = resolveSlot(slots, tokens, 'ghStatText', {
    color: 'muted',
    fontSize: 'xs',
  })
  const { descriptionStyle } = CommonTextSurfaces({ slots, sharedTextStyle })

  const urlParts = url.match(/github\.com\/([^/]+)\/([^/]+)/)
  const owner = repoOwner ?? urlParts?.[1]
  const repo = repoName ?? urlParts?.[2]?.replace(/\.git$/, '')
  const repoDisplay =
    owner != null && repo != null ? `${owner} / ${repo}` : title ?? url

  return (
    <TouchableOpacity
      onPress={onPress}
      style={[cardSurface.style as ViewStyle | undefined, cardStyle]}
      activeOpacity={0.85}
      accessibilityRole="link"
      accessibilityLabel={repoDisplay}
      testID={testID ?? id}
    >
      <View style={bodySurface.style as ViewStyle | undefined}>
        <ProviderRow
          slots={slots}
          provider="github"
          sharedTextStyle={sharedTextStyle}
          domain="github.com"
        />
        <Text style={mergeTextStyle(sharedTextStyle, repoNameSurface)} numberOfLines={1}>
          {repoDisplay}
        </Text>
        {(repoDescription ?? description) != null ? (
          <Text style={descriptionStyle} numberOfLines={3}>
            {repoDescription ?? description}
          </Text>
        ) : null}
        <View style={ghStatsRowSurface.style as ViewStyle | undefined}>
          {language != null ? (
            <View style={ghStatSurface.style as ViewStyle | undefined}>
              <View style={ghLangDotSurface.style as ViewStyle | undefined} />
              <Text style={mergeTextStyle(sharedTextStyle, ghStatTextSurface)}>
                {language}
              </Text>
            </View>
          ) : null}
          {stars != null ? (
            <View style={ghStatSurface.style as ViewStyle | undefined}>
              <Text style={mergeTextStyle(sharedTextStyle, ghStatIconSurface)}>*</Text>
              <Text style={mergeTextStyle(sharedTextStyle, ghStatTextSurface)}>
                {formatNumber(stars)}
              </Text>
            </View>
          ) : null}
          {forks != null ? (
            <View style={ghStatSurface.style as ViewStyle | undefined}>
              <Text style={mergeTextStyle(sharedTextStyle, ghStatIconSurface)}>F</Text>
              <Text style={mergeTextStyle(sharedTextStyle, ghStatTextSurface)}>
                {formatNumber(forks)}
              </Text>
            </View>
          ) : null}
        </View>
      </View>
    </TouchableOpacity>
  )
}

function SpotifyEmbed(props: LinkEmbedBaseProps & { provider: LinkEmbedProvider; domain: string; onPress: () => void; sharedTextStyle: TextStyle; cardStyle?: ViewStyle }) {
  const tokens = useTokens()
  const {
    slots,
    title,
    onPress,
    sharedTextStyle,
    trackName,
    artistName,
    albumArtUrl,
    durationMs,
    testID,
    id,
    cardStyle,
  } = props
  const cardSurface = resolveCardSurface(slots, tokens, '#191414')
  const bodySurface = resolveSlot(slots, tokens, 'body', {
    padding: 'md',
    flexDirection: 'row',
    alignItems: 'center',
  })
  const spotifyAlbumArtSurface = resolveSlot(slots, tokens, 'spotifyAlbumArt', {
    width: 64,
    height: 64,
    borderRadius: 'sm',
  })
  const playButtonSurface = resolveSlot(slots, tokens, 'playButton', {
    width: 40,
    height: 40,
    borderRadius: 'full',
    backgroundColor: BRAND_COLORS.spotify,
    alignItems: 'center',
    justifyContent: 'center',
  })
  const playIconSurface = resolveSlot(slots, tokens, 'playIcon', {
    color: '#FFFFFF',
    fontSize: 'sm',
    fontWeight: 'bold',
  })
  const titleSurface = resolveSlot(slots, tokens, 'title', {
    color: '#FFFFFF',
    fontSize: 'sm',
    fontWeight: 'semibold',
  })
  const descriptionSurface = resolveSlot(slots, tokens, 'description', {
    color: '#B3B3B3',
    fontSize: 'xs',
  })
  const metricTextSurface = resolveSlot(slots, tokens, 'metricText', {
    color: '#686868',
    fontSize: 'xs',
    marginTop: 4,
  })

  return (
    <TouchableOpacity
      onPress={onPress}
      style={[cardSurface.style as ViewStyle | undefined, cardStyle]}
      activeOpacity={0.85}
      accessibilityRole="link"
      accessibilityLabel={trackName ?? title ?? 'Spotify track'}
      testID={testID ?? id}
    >
      <View style={bodySurface.style as ViewStyle | undefined}>
        {albumArtUrl != null ? (
          <Image
            source={{ uri: albumArtUrl }}
            style={spotifyAlbumArtSurface.style as ImageStyle | undefined}
            resizeMode="cover"
            accessibilityLabel="Album art"
          />
        ) : null}
        <View style={{ flex: 1, marginLeft: albumArtUrl != null ? 12 : 0 }}>
          <ProviderRow
            slots={slots}
            provider="spotify"
            sharedTextStyle={sharedTextStyle}
            domain="spotify.com"
          />
          <Text style={mergeTextStyle(sharedTextStyle, titleSurface)} numberOfLines={1}>
            {trackName ?? title ?? 'Untitled track'}
          </Text>
          {artistName != null ? (
            <Text style={mergeTextStyle(sharedTextStyle, descriptionSurface)} numberOfLines={1}>
              {artistName}
            </Text>
          ) : null}
          {durationMs != null ? (
            <Text style={mergeTextStyle(sharedTextStyle, metricTextSurface)}>
              {formatDuration(durationMs)}
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

function FigmaEmbed(props: LinkEmbedBaseProps & { provider: LinkEmbedProvider; domain: string; onPress: () => void; sharedTextStyle: TextStyle; cardStyle?: ViewStyle }) {
  const tokens = useTokens()
  const {
    slots,
    title,
    imageUrl,
    onPress,
    sharedTextStyle,
    fileName,
    lastModified,
    thumbnailUrl,
    testID,
    id,
    cardStyle,
  } = props
  const cardSurface = resolveCardSurface(slots, tokens, tokens.colors.surface)
  const bodySurface = resolveSlot(slots, tokens, 'body', {
    padding: 'md',
  })
  const { titleStyle, descriptionStyle } = CommonTextSurfaces({ slots, sharedTextStyle })

  return (
    <TouchableOpacity
      onPress={onPress}
      style={[cardSurface.style as ViewStyle | undefined, cardStyle]}
      activeOpacity={0.85}
      accessibilityRole="link"
      accessibilityLabel={fileName ?? title ?? 'Figma file'}
      testID={testID ?? id}
    >
      <Thumbnail
        slots={slots}
        source={thumbnailUrl ?? imageUrl}
        accessibilityLabel="Figma preview"
      />
      <View style={bodySurface.style as ViewStyle | undefined}>
        <ProviderRow
          slots={slots}
          provider="figma"
          sharedTextStyle={sharedTextStyle}
          domain="figma.com"
        />
        <Text style={titleStyle} numberOfLines={2}>
          {fileName ?? title ?? 'Untitled'}
        </Text>
        {lastModified != null ? (
          <Text style={descriptionStyle}>{`Last modified: ${lastModified}`}</Text>
        ) : null}
      </View>
    </TouchableOpacity>
  )
}

function GenericEmbed(props: LinkEmbedBaseProps & { provider: LinkEmbedProvider; domain: string; onPress: () => void; sharedTextStyle: TextStyle; cardStyle?: ViewStyle }) {
  const tokens = useTokens()
  const {
    slots,
    title,
    description,
    imageUrl,
    domain,
    favicon,
    provider,
    onPress,
    sharedTextStyle,
    testID,
    id,
    cardStyle,
  } = props
  const cardSurface = resolveCardSurface(slots, tokens, tokens.colors.surface)
  const bodySurface = resolveSlot(slots, tokens, 'body', {
    padding: 'md',
  })
  const brandIconSurface = resolveSlot(slots, tokens, 'brandIcon', {
    color: BRAND_COLORS[provider],
    fontSize: 'xs',
    fontWeight: 'bold',
    marginRight: 6,
  })
  const providerRowSurface = resolveSlot(slots, tokens, 'providerRow', {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 'xs',
  })
  const providerLabelSurface = resolveSlot(slots, tokens, 'providerLabel', {
    color: 'muted',
    fontSize: 'xs',
    fontWeight: 'medium',
    flex: 1,
  })
  const externalArrowSurface = resolveSlot(slots, tokens, 'externalArrow', {
    color: 'muted',
    fontSize: 'xs',
    marginLeft: 4,
  })
  const { titleStyle, descriptionStyle } = CommonTextSurfaces({ slots, sharedTextStyle })

  const knownProvider = provider !== 'generic'

  return (
    <TouchableOpacity
      onPress={onPress}
      style={[cardSurface.style as ViewStyle | undefined, cardStyle]}
      activeOpacity={0.85}
      accessibilityRole="link"
      accessibilityLabel={title ?? domain ?? 'Open link'}
      accessibilityHint={description ?? `Opens ${domain}`}
      testID={testID ?? id}
    >
      <Thumbnail
        slots={slots}
        source={imageUrl}
        accessibilityLabel={title ?? domain ?? 'Link preview'}
      />
      <View style={bodySurface.style as ViewStyle | undefined}>
        <View style={providerRowSurface.style as ViewStyle | undefined}>
          {knownProvider ? (
            <Text style={mergeTextStyle(sharedTextStyle, brandIconSurface)}>
              {BRAND_ICONS[provider]}
            </Text>
          ) : favicon != null && !/^https?:\/\//.test(favicon) ? (
            <Text style={mergeTextStyle(sharedTextStyle, brandIconSurface)}>
              {favicon}
            </Text>
          ) : favicon != null ? (
            <Image
              source={{ uri: favicon }}
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

/**
 * Standalone LinkEmbed — plain React props, no manifest required.
 *
 * @example
 * <LinkEmbedBase url="https://github.com/foo/bar" stars={42} />
 */
export function LinkEmbedBase(props: LinkEmbedBaseProps) {
  const tokens = useTokens()
  const sharedTextStyle = resolveNativeTextStyle({}, tokens)

  const url = props.url
  const domain = props.domain ?? getDomain(url)
  const provider: LinkEmbedProvider = props.provider ?? detectProvider(url)

  const onPress = props.onPress ?? (() => void Linking.openURL(url))

  const passProps = {
    ...props,
    domain,
    provider,
    onPress,
    sharedTextStyle,
    cardStyle: props.style,
  }

  switch (provider) {
    case 'youtube':
      return <YouTubeEmbed {...passProps} />
    case 'twitter':
      return <TwitterEmbed {...passProps} />
    case 'github':
      return <GitHubEmbed {...passProps} />
    case 'spotify':
      return <SpotifyEmbed {...passProps} />
    case 'figma':
      return <FigmaEmbed {...passProps} />
    default:
      return <GenericEmbed {...passProps} />
  }
}
