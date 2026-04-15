
import { extendComponentSchema } from '../../_base'
import { fromRefSchema as FromRefSchema } from '@lastshotlabs/frontend-contract/refs'
import type { Action } from '../../../actions/types'

const ActionSchema = z.custom<Action>()

export const LinkEmbedSchema = extendComponentSchema({
  id: z.string().optional(),
  url: z.union([z.string(), FromRefSchema]),
  title: z.union([z.string(), FromRefSchema]).optional(),
  description: z.union([z.string(), FromRefSchema]).optional(),
  imageUrl: z.union([z.string(), FromRefSchema]).optional(),
  favicon: z.string().optional(),
  domain: z.union([z.string(), FromRefSchema]).optional(),
  onPress: ActionSchema.optional(),
  testID: z.string().optional(),

  // ── Provider-specific metadata ────────────────────────────────────────────
  /** Override auto-detected provider. Auto-detects: youtube, twitter, github, spotify, figma, notion, linear */
  provider: z.enum([
    'youtube', 'twitter', 'github', 'spotify', 'figma', 'notion', 'linear', 'generic',
  ]).optional(),

  // YouTube
  videoId: z.string().optional(),

  // Twitter / X
  authorName: z.string().optional(),
  authorHandle: z.string().optional(),
  authorAvatarUrl: z.string().optional(),
  tweetText: z.string().optional(),
  metrics: z.object({
    likes: z.number().optional(),
    retweets: z.number().optional(),
    replies: z.number().optional(),
  }).optional(),

  // GitHub
  repoOwner: z.string().optional(),
  repoName: z.string().optional(),
  repoDescription: z.string().optional(),
  language: z.string().optional(),
  languageColor: z.string().optional(),
  stars: z.number().optional(),
  forks: z.number().optional(),

  // Spotify
  trackName: z.string().optional(),
  artistName: z.string().optional(),
  albumArtUrl: z.string().optional(),
  durationMs: z.number().optional(),

  // Figma
  fileName: z.string().optional(),
  lastModified: z.string().optional(),
  thumbnailUrl: z.string().optional(),
})

