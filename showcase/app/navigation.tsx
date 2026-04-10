import { View, Text, StyleSheet } from 'react-native'
import {
  Tabs,
  SegmentedControl,
  Header,
  BackButton,
  Accordion,
  TreeView,
  Stack,
} from '@lastshotlabs/pocketshot/ui'
import { ShowcaseScreen, SectionLabel } from '@/lib/ShowcaseScreen'
import { MockProviders } from '@/lib/MockProviders'

export default function NavigationShowcase() {
  return (
    <ShowcaseScreen title="Navigation">
      <MockProviders>
        <SectionLabel label="Header — with back + right action" />
        <Header
          config={{
            title: 'My Feed',
            subtitle: 'Latest posts',
            showBack: true,
            rightAction: { icon: '🔔', label: 'Notifications', action: { type: 'toast', message: 'Notifications tapped' } },
          }}
        />

        <SectionLabel label="Header — multiple right actions" />
        <Header
          config={{
            title: 'Search Results',
            rightActions: [
              { icon: '⚙️', label: 'Settings', action: { type: 'toast', message: 'Settings tapped' } },
              { icon: '🔍', label: 'Search', action: { type: 'toast', message: 'Search tapped' } },
            ],
          }}
        />

        <SectionLabel label="Header — no subtitle, no back" />
        <Header
          config={{
            title: 'Pocketshot',
          }}
        />

        <SectionLabel label="Tabs — default variant" />
        <Tabs
          config={{
            id: 'main-tabs',
            tabs: [
              { id: 'home', label: 'Home' },
              { id: 'explore', label: 'Explore' },
              { id: 'notifications', label: 'Alerts' },
              { id: 'profile', label: 'Profile' },
            ],
            defaultTab: 'home',
            variant: 'default',
          }}
        />

        <SectionLabel label="Tabs — pills variant" />
        <Tabs
          config={{
            id: 'pills-tabs',
            tabs: [
              { id: 'all', label: 'All' },
              { id: 'trending', label: 'Trending' },
              { id: 'following', label: 'Following' },
            ],
            defaultTab: 'all',
            variant: 'pills',
          }}
        />

        <SectionLabel label="Tabs — underline variant" />
        <Tabs
          config={{
            id: 'underline-tabs',
            tabs: [
              { id: 'posts', label: 'Posts' },
              { id: 'media', label: 'Media' },
              { id: 'likes', label: 'Likes' },
            ],
            defaultTab: 'posts',
            variant: 'underline',
          }}
        />

        <SectionLabel label="SegmentedControl" />
        <Stack config={{ gap: 16 }}>
          <SegmentedControl
            config={{
              id: 'view-mode',
              options: [
                { label: 'List', value: 'list' },
                { label: 'Grid', value: 'grid' },
                { label: 'Map', value: 'map' },
              ],
              defaultValue: 'list',
            }}
          />
          <SegmentedControl
            config={{
              id: 'time-range',
              options: [
                { label: '1D', value: '1d' },
                { label: '1W', value: '1w' },
                { label: '1M', value: '1m' },
                { label: '1Y', value: '1y' },
                { label: 'All', value: 'all' },
              ],
              defaultValue: '1m',
            }}
          />
        </Stack>

        <SectionLabel label="BackButton — variants" />
        <Stack config={{ gap: 8 }}>
          <BackButton config={{ label: 'Back' }} />
          <BackButton config={{ label: 'Go to Home', action: { type: 'navigate', path: '/' } }} />
          <BackButton config={{ label: 'Cancel' }} />
        </Stack>

        <SectionLabel label="Accordion — FAQ style (default variant)" />
        <Accordion
          config={{
            id: 'faq-accordion',
            sections: [
              { id: 'what', title: 'What is Pocketshot?', content: 'Pocketshot is the React Native SDK for bunshot-powered backends. It provides hooks, typed API clients, and a config-driven UI layer.' },
              { id: 'how', title: 'How do I get started?', content: 'Run `pocketshot init` in your Expo project, configure your backend URL, and start using the generated hooks.' },
              { id: 'tokens', title: 'What are design tokens?', content: 'Tokens are semantic design primitives — colors, spacing, typography, and radii — that drive all visual properties across components.' },
              { id: 'offline', title: 'Does it work offline?', content: 'Yes. The offline module uses expo-sqlite for local persistence and automatically syncs queued mutations when connectivity is restored.' },
            ],
            defaultOpenIds: ['what'],
            allowMultiple: true,
            variant: 'default',
          }}
        />

        <SectionLabel label="Accordion — bordered variant" />
        <Accordion
          config={{
            id: 'settings-accordion',
            sections: [
              { id: 'account', title: 'Account Settings', icon: '👤', content: 'Manage your profile, email preferences, and connected accounts.' },
              { id: 'security', title: 'Security & Privacy', icon: '🔒', content: 'Enable two-factor authentication, manage sessions, and configure privacy controls.' },
              { id: 'billing', title: 'Billing & Plans', icon: '💳', subtitle: 'Pro Plan', content: 'View invoices, update payment methods, and manage your subscription.' },
            ],
            allowMultiple: false,
            variant: 'bordered',
          }}
        />

        <SectionLabel label="TreeView — file system" />
        <TreeView
          config={{
            id: 'file-tree',
            data: [
              {
                id: 'src',
                label: 'src',
                icon: '📁',
                children: [
                  {
                    id: 'components',
                    label: 'components',
                    icon: '📁',
                    children: [
                      { id: 'button', label: 'Button.tsx', icon: '📄' },
                      { id: 'alert', label: 'Alert.tsx', icon: '📄' },
                    ],
                  },
                  {
                    id: 'hooks',
                    label: 'hooks',
                    icon: '📁',
                    children: [
                      { id: 'useauth', label: 'useAuth.ts', icon: '📄' },
                    ],
                  },
                  { id: 'index', label: 'index.ts', icon: '📄' },
                ],
              },
              {
                id: 'tests',
                label: 'tests',
                icon: '📁',
                children: [
                  { id: 'button-test', label: 'Button.test.tsx', icon: '📄' },
                ],
              },
            ],
            defaultExpandedIds: ['src', 'components'],
            showConnectors: true,
            onItemPress: { type: 'toast', message: 'File selected' },
          }}
        />

        <View style={styles.spacer} />
      </MockProviders>
    </ShowcaseScreen>
  )
}

const styles = StyleSheet.create({
  spacer: { height: 32 },
})
