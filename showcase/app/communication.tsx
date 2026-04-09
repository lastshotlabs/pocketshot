import {
  ChatBubble,
  NotificationItem,
  ActivityFeed,
  Stack,
  Divider,
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
      </MockProviders>
    </ShowcaseScreen>
  )
}
