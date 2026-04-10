import { useEffect } from 'react'
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
  useScreenContext,
} from '@lastshotlabs/pocketshot/ui'
import { ShowcaseScreen, SectionLabel } from '@/lib/ShowcaseScreen'
import { MockProviders } from '@/lib/MockProviders'

export default function CommunicationShowcase() {
  return (
    <ShowcaseScreen title="Communication">
      <MockProviders>
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
              message: 'Yes! The config-driven UI layer looks amazing. I love how components auto-fetch their data.',
              sender: 'Me',
              timestamp: '10:33 AM',
              isOwn: true,
              status: 'read',
            }}
          />
          <ChatBubble
            config={{
              message: 'Exactly. And the token system makes theming super clean. No more hardcoded colors 🎨',
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

        <Divider config={{ marginVertical: 8 }} />

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
          <NotificationItem
            config={{
              title: 'System maintenance tonight',
              body: 'Scheduled downtime 2:00 AM – 3:00 AM UTC.',
              timestamp: 'Yesterday',
              read: true,
              icon: '⚙️',
              onDismiss: { type: 'toast', message: 'Dismissed' },
            }}
          />
        </Stack>

        <Divider config={{ marginVertical: 8 }} />

        <SectionLabel label="ActivityFeed — empty state" />
        <ActivityFeed
          config={{
            emptyMessage: 'No activity yet — invite your team to get started.',
            itemHeight: 72,
          }}
        />

        <Divider config={{ marginVertical: 8 }} />

        <SectionLabel label="ReactionBar — reactions with counts" />
        <ReactionBar
          config={{
            reactions: [
              { emoji: '\ud83d\udc4d', label: 'Like', count: 12, reacted: true },
              { emoji: '\u2764\ufe0f', label: 'Love', count: 8, reacted: false },
              { emoji: '\ud83d\ude02', label: 'Laugh', count: 5, reacted: true },
              { emoji: '\ud83d\ude2e', label: 'Wow', count: 2, reacted: false },
              { emoji: '\ud83c\udf89', label: 'Celebrate', count: 3, reacted: false },
              { emoji: '\ud83d\udd25', label: 'Fire', count: 1, reacted: false },
            ],
          }}
        />

        <Divider config={{ marginVertical: 8 }} />

        <SectionLabel label="PresenceIndicator — all statuses" />
        <Row config={{ gap: 16, align: 'center' }}>
          <PresenceIndicator config={{ status: 'online' }} />
          <PresenceIndicator config={{ status: 'offline' }} />
          <PresenceIndicator config={{ status: 'away' }} />
          <PresenceIndicator config={{ status: 'busy' }} />
          <PresenceIndicator config={{ status: 'idle' }} />
        </Row>

        <SectionLabel label="PresenceIndicator — with labels" />
        <Row config={{ gap: 16, align: 'center', wrap: true }}>
          <PresenceIndicator config={{ status: 'online', showLabel: true }} />
          <PresenceIndicator config={{ status: 'offline', showLabel: true }} />
          <PresenceIndicator config={{ status: 'away', showLabel: true }} />
          <PresenceIndicator config={{ status: 'busy', showLabel: true }} />
          <PresenceIndicator config={{ status: 'idle', showLabel: true }} />
        </Row>

        <Divider config={{ marginVertical: 8 }} />

        <SectionLabel label="TypingIndicator — active with user name" />
        <TypingIndicator config={{ isTyping: true, userName: 'Alice' }} />

        <SectionLabel label="TypingIndicator — inactive" />
        <TypingIndicator config={{ isTyping: false }} />

        <Divider config={{ marginVertical: 8 }} />

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
        body: 'Step-by-step guide for setting up Maestro flows against a local bunshot dev instance. Covers auth, community, and push flows.',
        author: { name: 'Carol Davis' },
        createdAt: '2026-04-07T11:15:00Z',
        tags: ['testing', 'docs'],
      },
      {
        id: 'feed-4',
        title: 'WebSocket Reconnection Improvements',
        body: 'Exponential backoff now respects AppState transitions. Connections pause on background and resume on foreground automatically.',
        author: { name: 'Dan Wilson', avatarUrl: 'https://picsum.photos/seed/dan/100/100' },
        createdAt: '2026-04-06T09:45:00Z',
        tags: ['websocket', 'reliability'],
      },
    ])

    const messages = [
      {
        id: 'msg-1',
        senderId: 'user-alice',
        senderName: 'Alice',
        body: 'Has anyone tested the new offline sync module?',
        createdAt: '2026-04-09T10:00:00Z',
      },
      {
        id: 'msg-2',
        senderId: 'user-me',
        senderName: 'Me',
        body: 'Yes, it works great with expo-sqlite. Queued mutations replay perfectly after reconnect.',
        createdAt: '2026-04-09T10:01:00Z',
      },
      {
        id: 'msg-3',
        senderId: 'user-alice',
        senderName: 'Alice',
        body: 'Nice! What about conflict resolution when two devices edit the same record?',
        createdAt: '2026-04-09T10:02:00Z',
      },
      {
        id: 'msg-4',
        senderId: 'user-me',
        senderName: 'Me',
        body: 'Last-write-wins by default, but you can provide a custom merge function in the sync config.',
        createdAt: '2026-04-09T10:03:00Z',
      },
    ]

    setValue('threadMessages', messages)
    setValue('chatMessages', messages)
  }, [])

  return (
    <Stack config={{ gap: 16 }}>
      <SectionLabel label="Feed — data-driven post list" />
      <Feed
        config={{
          data: { from: 'feedData' },
          showAvatars: true,
          emptyMessage: 'No posts yet',
        }}
      />

      <Divider config={{ marginVertical: 8 }} />

      <SectionLabel label="MessageThread — conversation history" />
      <MessageThread
        config={{
          data: { from: 'threadMessages' },
          currentUserId: 'user-me',
          showAvatars: true,
        }}
      />

      <Divider config={{ marginVertical: 8 }} />

      <SectionLabel label="ChatWindow — interactive chat" />
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
    </Stack>
  )
}
