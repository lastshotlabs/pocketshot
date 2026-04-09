import { View, Text, StyleSheet } from 'react-native'
import {
  Tabs,
  SegmentedControl,
  Header,
  BackButton,
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

        <View style={styles.spacer} />
      </MockProviders>
    </ShowcaseScreen>
  )
}

const styles = StyleSheet.create({
  spacer: { height: 32 },
})
