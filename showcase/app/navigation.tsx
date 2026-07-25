import { View, Text, StyleSheet, Pressable } from 'react-native'
import {
  Tabs,
  SegmentedControl,
  Header,
  BackButton,
  Accordion,
  TreeView,
  TopBar,
  BottomTabBar,
  DrawerMenu,
  Stack,
  useScreenContext,
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
            rightAction: {
              icon: '🔔',
              label: 'Notifications',
              action: { type: 'toast', message: 'Notifications tapped' },
            },
          }}
        />

        <SectionLabel label="Header — multiple right actions" />
        <Header
          config={{
            title: 'Search Results',
            rightActions: [
              {
                icon: '⚙️',
                label: 'Settings',
                action: { type: 'toast', message: 'Settings tapped' },
              },
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
          <BackButton config={{ label: 'Go to Home', action: { type: 'navigate', to: '/' } }} />
          <BackButton config={{ label: 'Cancel' }} />
        </Stack>

        <SectionLabel label="Accordion — FAQ style (default variant)" />
        <Accordion
          config={{
            id: 'faq-accordion',
            sections: [
              {
                id: 'what',
                title: 'What is Pocketshot?',
                content:
                  'Pocketshot is the React Native SDK for Slingshot-powered backends. It provides hooks, typed API clients, and a config-driven UI layer.',
              },
              {
                id: 'how',
                title: 'How do I get started?',
                content:
                  'Run `pocketshot init` in your Expo project, configure your backend URL, and start using the generated hooks.',
              },
              {
                id: 'tokens',
                title: 'What are design tokens?',
                content:
                  'Tokens are semantic design primitives — colors, spacing, typography, and radii — that drive all visual properties across components.',
              },
              {
                id: 'offline',
                title: 'Does it work offline?',
                content:
                  'Yes. The offline module uses expo-sqlite for local persistence and automatically syncs queued mutations when connectivity is restored.',
              },
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
              {
                id: 'account',
                title: 'Account Settings',
                icon: '👤',
                content: 'Manage your profile, email preferences, and connected accounts.',
              },
              {
                id: 'security',
                title: 'Security & Privacy',
                icon: '🔒',
                content:
                  'Enable two-factor authentication, manage sessions, and configure privacy controls.',
              },
              {
                id: 'billing',
                title: 'Billing & Plans',
                icon: '💳',
                subtitle: 'Pro Plan',
                content: 'View invoices, update payment methods, and manage your subscription.',
              },
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
                    children: [{ id: 'useauth', label: 'useAuth.ts', icon: '📄' }],
                  },
                  { id: 'index', label: 'index.ts', icon: '📄' },
                ],
              },
              {
                id: 'tests',
                label: 'tests',
                icon: '📁',
                children: [{ id: 'button-test', label: 'Button.test.tsx', icon: '📄' }],
              },
            ],
            defaultExpandedIds: ['src', 'components'],
            showConnectors: true,
            onItemPress: { type: 'toast', message: 'File selected' },
          }}
        />

        <View style={styles.spacer} />

        <NavigationNewDemos />
      </MockProviders>
    </ShowcaseScreen>
  )
}

function NavigationNewDemos() {
  const { setValue } = useScreenContext()

  return (
    <>
      <SectionLabel label="TopBar — with title, subtitle, back + right actions" />
      <TopBar
        config={{
          id: 'top-bar-demo',
          title: 'Messages',
          subtitle: '3 unread',
          leftAction: 'back',
          rightActions: [
            { icon: '🔍', onPress: { type: 'toast', message: 'Search tapped' } },
            { icon: '✏️', onPress: { type: 'toast', message: 'Compose tapped' } },
          ],
          testID: 'top-bar-demo',
        }}
      />

      <SectionLabel label="BottomTabBar — 4 tabs with badge" />
      <BottomTabBar
        config={{
          id: 'bottom-tabs-demo',
          tabs: [
            {
              id: 'home',
              label: 'Home',
              icon: '🏠',
              onPress: { type: 'toast', message: 'Home tapped' },
            },
            {
              id: 'search',
              label: 'Search',
              icon: '🔍',
              onPress: { type: 'toast', message: 'Search tapped' },
            },
            {
              id: 'notifications',
              label: 'Alerts',
              icon: '🔔',
              badge: 5,
              onPress: { type: 'toast', message: 'Notifications tapped' },
            },
            {
              id: 'profile',
              label: 'Profile',
              icon: '👤',
              onPress: { type: 'toast', message: 'Profile tapped' },
            },
          ],
          activeTab: 'home',
          showLabels: true,
          testID: 'bottom-tabs-demo',
        }}
      />

      <SectionLabel label="DrawerMenu — with header, grouped items, footer" />
      <Pressable
        style={styles.drawerTrigger}
        onPress={() => setValue('drawer-menu-demo-open', true)}
        testID="drawer-menu-trigger"
        accessibilityLabel="Open drawer menu"
        accessibilityRole="button"
      >
        <Text style={styles.drawerTriggerText}>Open Drawer Menu</Text>
      </Pressable>
      <DrawerMenu
        config={{
          id: 'drawer-menu-demo',
          header: {
            title: 'Jane Smith',
            subtitle: 'jane@example.com',
            avatar: '👩',
          },
          items: [
            {
              id: 'home',
              label: 'Home',
              icon: '🏠',
              section: 'Main',
              onPress: { type: 'toast', message: 'Home tapped' },
            },
            {
              id: 'projects',
              label: 'Projects',
              icon: '📁',
              section: 'Main',
              onPress: { type: 'toast', message: 'Projects tapped' },
            },
            {
              id: 'messages',
              label: 'Messages',
              icon: '💬',
              section: 'Main',
              badge: 3,
              onPress: { type: 'toast', message: 'Messages tapped' },
            },
            {
              id: 'settings',
              label: 'Settings',
              icon: '⚙️',
              section: 'Preferences',
              onPress: { type: 'toast', message: 'Settings tapped' },
            },
            {
              id: 'help',
              label: 'Help & Support',
              icon: '❓',
              section: 'Preferences',
              onPress: { type: 'toast', message: 'Help tapped' },
            },
          ],
          footer: {
            label: 'Sign Out',
            onPress: { type: 'toast', message: 'Sign out tapped' },
          },
          testID: 'drawer-menu-demo',
        }}
      />

      <View style={styles.spacerLg} />
    </>
  )
}

const styles = StyleSheet.create({
  spacer: { height: 32 },
  spacerLg: { height: 48 },
  drawerTrigger: {
    backgroundColor: '#2563eb',
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 8,
    alignItems: 'center',
  },
  drawerTriggerText: {
    color: '#ffffff',
    fontSize: 14,
    fontWeight: '600',
  },
})
