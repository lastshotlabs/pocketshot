import { useEffect } from 'react'
import { View } from 'react-native'
import {
  ChatBubble,
  NotificationItem,
  ActivityFeed,
  Stack,
  Row,
  Divider,
  Feed,
  ReactionBar,
  PresenceIndicator,
  TypingIndicator,
  MessageThread,
  ChatWindow,
  CommentSection,
  EmojiPicker,
  GifPicker,
  ReactionPicker,
  LinkEmbed,
  useScreenContext,
} from '@lastshotlabs/pocketshot/ui'
import { ShowcaseScreen, SectionLabel } from '@/lib/ShowcaseScreen'
import { MockProviders } from '@/lib/MockProviders'

export default function CommunicationShowcase() {
  return (
    <ShowcaseScreen title="Communication">
      <MockProviders>
        {/* ── ChatBubble ────────────────────────────────────────────── */}
        <SectionLabel label="ChatBubble — conversation thread" />
        <Stack config={{ gap: 8 }}>
          <ChatBubble
            config={{
              message: 'Hey! Did you see the new Pocketshot release?',
              sender: 'Alice',
              timestamp: '10:32 AM',
              isOwn: false,
              avatar: { name: 'Alice' },
              status: 'read',
            }}
          />
          <ChatBubble
            config={{
              message:
                'Yes! The config-driven UI layer looks amazing. I love how components auto-fetch their data.',
              sender: 'Me',
              timestamp: '10:33 AM',
              isOwn: true,
              status: 'read',
            }}
          />
          <ChatBubble
            config={{
              message:
                'Exactly. And the token system makes theming super clean. No more hardcoded colors 🎨',
              sender: 'Alice',
              timestamp: '10:34 AM',
              isOwn: false,
              avatar: { name: 'Alice' },
              status: 'read',
            }}
          />
          <ChatBubble
            config={{
              message: 'We should migrate the mobile app this sprint.',
              sender: 'Me',
              timestamp: '10:35 AM',
              isOwn: true,
              status: 'sent',
            }}
          />
          <ChatBubble
            config={{
              message: 'Agreed! Let me set up a sync.',
              sender: 'Alice',
              timestamp: '10:36 AM',
              isOwn: false,
              avatar: { name: 'Alice' },
              status: 'read',
            }}
          />
          <ChatBubble
            config={{
              message: 'Sounds good, talk later!',
              sender: 'Me',
              timestamp: '10:37 AM',
              isOwn: true,
              status: 'sending',
            }}
          />
        </Stack>

        <Divider config={{ marginY: 8 }} />

        {/* ── NotificationItem ──────────────────────────────────────── */}
        <SectionLabel label="NotificationItem — read + unread" />
        <Stack config={{ gap: 4 }}>
          <NotificationItem
            config={{
              title: 'Alice liked your post',
              body: '"Shipping the config-driven UI layer today 🚀"',
              timestamp: '2 min ago',
              read: false,
              icon: '❤️',
              onPress: { type: 'toast', message: 'Notification tapped' },
            }}
          />
          <NotificationItem
            config={{
              title: 'Bob started following you',
              body: 'You now have 128 followers',
              timestamp: '15 min ago',
              read: false,
              icon: '👤',
              onPress: { type: 'toast', message: 'Follow notification tapped' },
            }}
          />
          <NotificationItem
            config={{
              title: 'Your report is ready',
              body: 'Monthly analytics report for April 2026 is available.',
              timestamp: '1 hour ago',
              read: true,
              icon: '📊',
              onPress: { type: 'toast', message: 'Report notification tapped' },
            }}
          />
          <NotificationItem
            config={{
              title: 'New comment on your thread',
              body: '"Great point about FlatList virtualization!"',
              timestamp: '3 hours ago',
              read: true,
              icon: '💬',
            }}
          />
        </Stack>

        <Divider config={{ marginY: 8 }} />

        {/* ── ReactionBar ───────────────────────────────────────────── */}
        <SectionLabel label="ReactionBar — reactions with counts" />
        <ReactionBar
          config={{
            reactions: [
              { emoji: '👍', label: 'Like', count: 12, reacted: true },
              { emoji: '❤️', label: 'Love', count: 8, reacted: false },
              { emoji: '😂', label: 'Laugh', count: 5, reacted: true },
              { emoji: '😮', label: 'Wow', count: 2, reacted: false },
              { emoji: '🎉', label: 'Celebrate', count: 3, reacted: false },
              { emoji: '🔥', label: 'Fire', count: 1, reacted: false },
            ],
          }}
        />

        <Divider config={{ marginY: 8 }} />

        {/* ── Presence + Typing ──────────────────────────────────────── */}
        <SectionLabel label="PresenceIndicator — all statuses" />
        <Row config={{ gap: 16, alignItems: 'center' }}>
          <PresenceIndicator config={{ status: 'online' }} />
          <PresenceIndicator config={{ status: 'offline' }} />
          <PresenceIndicator config={{ status: 'away' }} />
          <PresenceIndicator config={{ status: 'busy' }} />
          <PresenceIndicator config={{ status: 'idle' }} />
        </Row>

        <SectionLabel label="PresenceIndicator — with labels" />
        <Row config={{ gap: 16, alignItems: 'center', flexWrap: 'wrap' }}>
          <PresenceIndicator config={{ status: 'online', showLabel: true }} />
          <PresenceIndicator config={{ status: 'offline', showLabel: true }} />
          <PresenceIndicator config={{ status: 'away', showLabel: true }} />
          <PresenceIndicator config={{ status: 'busy', showLabel: true }} />
          <PresenceIndicator config={{ status: 'idle', showLabel: true }} />
        </Row>

        <SectionLabel label="TypingIndicator" />
        <TypingIndicator config={{ isTyping: true, userName: 'Alice' }} />

        <Divider config={{ marginY: 8 }} />

        {/* ── Pickers — grouped compact ─────────────────────────────── */}
        <SectionLabel label="Pickers — emoji, GIF, reaction" />
        <Row config={{ gap: 12, alignItems: 'center', flexWrap: 'wrap' }}>
          <EmojiPicker
            config={{
              id: 'showcase-emoji-picker',
              onSelect: { type: 'toast', message: 'Emoji selected' },
              recentEmojis: ['😀', '🚀', '🎨', '🔥', '✅', '💯'],
            }}
          />
          <GifPicker
            config={{
              id: 'showcase-gif-picker',
              onSelect: { type: 'toast', message: 'GIF selected' },
              placeholder: 'Search GIFs...',
              sampleGifs: [
                { id: 'gif-1', url: 'https://picsum.photos/seed/gif1/200/150' },
                { id: 'gif-2', url: 'https://picsum.photos/seed/gif2/200/150' },
                { id: 'gif-3', url: 'https://picsum.photos/seed/gif3/200/150' },
                { id: 'gif-4', url: 'https://picsum.photos/seed/gif4/200/150' },
                { id: 'gif-5', url: 'https://picsum.photos/seed/gif5/200/150' },
                { id: 'gif-6', url: 'https://picsum.photos/seed/gif6/200/150' },
              ],
            }}
          />
          <ReactionPicker
            config={{
              id: 'showcase-reaction-picker',
              reactions: ['👍', '❤️', '😂', '😮', '😢', '🔥'],
              onSelect: { type: 'toast', message: 'Reaction selected' },
              triggerLabel: 'React',
            }}
          />
        </Row>

        <Divider config={{ marginY: 8 }} />

        {/* ── LinkEmbed — rich provider embeds ───────────────────────── */}
        <SectionLabel label="LinkEmbed — YouTube" />
        <LinkEmbed
          config={{
            url: 'https://www.youtube.com/watch?v=dQw4w9WgXcQ',
            title: 'Building Config-Driven Mobile Apps with Pocketshot',
            description:
              'A deep dive into how Pocketshot turns JSON manifests into native iOS and Android screens.',
            videoId: 'dQw4w9WgXcQ',
          }}
        />

        <SectionLabel label="LinkEmbed — Twitter / X" />
        <LinkEmbed
          config={{
            url: 'https://x.com/lastshotlabs/status/123456',
            authorName: 'LastShot Labs',
            authorHandle: 'lastshotlabs',
            tweetText:
              'Just shipped Pocketshot 2.0 — 125 config-driven components, 8 design flavors, and full manifest-to-native rendering. The mobile SDK that actually has parity with web. 🚀',
            metrics: { likes: 2430, retweets: 312, replies: 89 },
          }}
        />

        <SectionLabel label="LinkEmbed — GitHub" />
        <LinkEmbed
          config={{
            url: 'https://github.com/lastshotlabs/pocketshot',
            repoOwner: 'lastshotlabs',
            repoName: 'pocketshot',
            repoDescription:
              'React Native/Expo SDK for Slingshot-powered backends. 125 config-addressable components, token-based theming, and CLI code generation.',
            language: 'TypeScript',
            languageColor: '#3178C6',
            stars: 4821,
            forks: 387,
          }}
        />

        <SectionLabel label="LinkEmbed — Spotify" />
        <LinkEmbed
          config={{
            url: 'https://open.spotify.com/track/example',
            trackName: 'Midnight City',
            artistName: 'M83',
            albumArtUrl: 'https://picsum.photos/seed/spotify/300/300',
            durationMs: 243000,
          }}
        />

        <SectionLabel label="LinkEmbed — generic" />
        <LinkEmbed
          config={{
            url: 'https://lastshotlabs.com/blog/config-driven-ui',
            title: 'Config-Driven UI: Build Mobile Apps Without Code',
            description:
              'Learn how Pocketshot turns JSON manifests into fully native React Native screens.',
            imageUrl: 'https://picsum.photos/seed/linkembed1/800/400',
            favicon: '🚀',
          }}
        />

        <Divider config={{ marginY: 8 }} />

        {/* ── Data-driven components ─────────────────────────────────── */}
        <CommunicationDemos />
      </MockProviders>
    </ShowcaseScreen>
  )
}

function CommunicationDemos() {
  const { setValue } = useScreenContext()

  useEffect(() => {
    setValue('feedData', [
      {
        id: 'feed-1',
        title: 'Pocketshot v0.9 Released',
        body: 'Config-driven UI layer is now stable with 80+ components, token-based theming, and full OpenAPI code generation.',
        author: { name: 'Alice Chen', avatarUrl: 'https://picsum.photos/seed/alice/100/100' },
        createdAt: '2026-04-09T08:00:00Z',
        tags: ['release', 'sdk'],
      },
      {
        id: 'feed-2',
        title: 'New Token Flavors: Ocean and Forest',
        body: 'Two new design token presets are available. Switch flavors instantly with no component changes required.',
        author: { name: 'Bob Martinez', avatarUrl: 'https://picsum.photos/seed/bob/100/100' },
        createdAt: '2026-04-08T14:30:00Z',
        tags: ['design', 'tokens'],
      },
      {
        id: 'feed-3',
        title: 'Maestro E2E Testing Guide',
        body: 'Step-by-step guide for setting up Maestro flows against a local Slingshot dev instance.',
        author: { name: 'Carol Davis' },
        createdAt: '2026-04-07T11:15:00Z',
        tags: ['testing', 'docs'],
      },
    ])

    const messages = [
      {
        id: 'msg-1',
        senderId: 'user-alice',
        senderName: 'Alice',
        content: 'Has anyone tested the new offline sync module?',
        createdAt: '2026-04-09T10:00:00Z',
      },
      {
        id: 'msg-2',
        senderId: 'user-me',
        senderName: 'Me',
        content:
          'Yes, it works great with expo-sqlite. Queued mutations replay perfectly after reconnect.',
        createdAt: '2026-04-09T10:01:00Z',
      },
      {
        id: 'msg-3',
        senderId: 'user-alice',
        senderName: 'Alice',
        content: 'Nice! What about conflict resolution when two devices edit the same record?',
        createdAt: '2026-04-09T10:02:00Z',
      },
      {
        id: 'msg-4',
        senderId: 'user-me',
        senderName: 'Me',
        content:
          'Last-write-wins by default, but you can provide a custom merge function in the sync config.',
        createdAt: '2026-04-09T10:03:00Z',
      },
      {
        id: 'msg-5',
        senderId: 'user-alice',
        senderName: 'Alice',
        content: 'That is really well thought out. Great API design.',
        createdAt: '2026-04-09T10:04:00Z',
      },
      {
        id: 'msg-6',
        senderId: 'user-me',
        senderName: 'Me',
        content: 'Thanks! We also added automatic retry with exponential backoff for failed syncs.',
        createdAt: '2026-04-09T10:05:00Z',
      },
    ]

    setValue('threadMessages', messages)
    setValue('chatMessages', messages)

    setValue('commentData', [
      {
        id: 'comment-1',
        author: { name: 'Alice Chen' },
        content: 'This config-driven approach is a game changer for rapid prototyping.',
        timestamp: '2026-04-09T09:00:00Z',
        likes: 5,
        replies: [
          {
            id: 'comment-1-1',
            author: { name: 'Bob Martinez' },
            content: 'Agreed! We cut our scaffold time in half.',
            timestamp: '2026-04-09T09:15:00Z',
            likes: 2,
            replies: [],
          },
        ],
      },
      {
        id: 'comment-2',
        author: { name: 'Me' },
        content: 'The token system makes theming trivial. One flavor swap and everything updates.',
        timestamp: '2026-04-09T09:30:00Z',
        likes: 3,
        replies: [],
      },
      {
        id: 'comment-3',
        author: { name: 'Carol Davis' },
        content: 'Has anyone benchmarked FlatList performance with 1000+ comments?',
        timestamp: '2026-04-09T10:00:00Z',
        likes: 1,
        replies: [
          {
            id: 'comment-3-1',
            author: { name: 'Alice Chen' },
            content: 'Virtualization handles it fine. No jank on mid-range Android devices.',
            timestamp: '2026-04-09T10:10:00Z',
            likes: 4,
            replies: [],
          },
        ],
      },
    ])
  }, [])

  return (
    <Stack config={{ gap: 16 }}>
      {/* ── Feed ──────────────────────────────────────────────────── */}
      <SectionLabel label="Feed — data-driven post list" />
      <View
        style={{
          height: 480,
          borderWidth: 1,
          borderColor: '#e4e4e7',
          borderRadius: 12,
          overflow: 'hidden',
        }}
      >
        <Feed
          config={{
            data: { from: 'feedData' },
            showAvatars: true,
            emptyMessage: 'No posts yet',
          }}
        />
      </View>

      <Divider config={{ marginY: 8 }} />

      {/* ── MessageThread ─────────────────────────────────────────── */}
      <SectionLabel label="MessageThread — conversation history" />
      <View
        style={{
          height: 380,
          borderWidth: 1,
          borderColor: '#e4e4e7',
          borderRadius: 12,
          overflow: 'hidden',
        }}
      >
        <MessageThread
          config={{
            data: { from: 'threadMessages' },
            currentUserId: 'user-me',
            showAvatars: true,
          }}
        />
      </View>

      <Divider config={{ marginY: 8 }} />

      {/* ── ChatWindow ────────────────────────────────────────────── */}
      <SectionLabel label="ChatWindow — interactive chat" />
      <View
        style={{
          height: 420,
          borderWidth: 1,
          borderColor: '#e4e4e7',
          borderRadius: 12,
          overflow: 'hidden',
        }}
      >
        <ChatWindow
          config={{
            id: 'showcase-chat',
            data: { from: 'chatMessages' },
            currentUserId: 'user-me',
            placeholder: 'Type a message...',
            onSendAction: { type: 'toast', message: 'Message sent' },
            showAvatars: true,
          }}
        />
      </View>

      <Divider config={{ marginY: 8 }} />

      {/* ── CommentSection ────────────────────────────────────────── */}
      <SectionLabel label="CommentSection — threaded comments" />
      <View
        style={{
          height: 420,
          borderWidth: 1,
          borderColor: '#e4e4e7',
          borderRadius: 12,
          overflow: 'hidden',
        }}
      >
        <CommentSection
          config={{
            id: 'showcase-comments',
            data: { from: 'commentData' },
            currentUserId: 'user-me',
            maxNestingLevel: 2,
            allowReplies: true,
            onSubmitComment: { type: 'toast', message: 'Comment submitted' },
            onLikeComment: { type: 'toast', message: 'Comment liked' },
            onDeleteComment: { type: 'toast', message: 'Comment deleted' },
          }}
        />
      </View>

      <Divider config={{ marginY: 8 }} />

      {/* ── ActivityFeed — empty state ────────────────────────────── */}
      <SectionLabel label="ActivityFeed — empty state" />
      <ActivityFeed
        config={{
          emptyMessage: 'No activity yet — invite your team to get started.',
          itemHeight: 72,
        }}
      />
    </Stack>
  )
}
