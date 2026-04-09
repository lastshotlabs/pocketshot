import {
  Badge,
  Avatar,
  AvatarGroup,
  StatCard,
  EmptyState,
  LoadingState,
  Stack,
  Row,
} from '@lastshotlabs/pocketshot/ui'
import { ShowcaseScreen, SectionLabel } from '@/lib/ShowcaseScreen'
import { MockProviders } from '@/lib/MockProviders'

export default function DataShowcase() {
  return (
    <ShowcaseScreen title="Data Display">
      <MockProviders>
        <SectionLabel label="Badge — variants" />
        <Row config={{ gap: 8, wrap: true }}>
          <Badge config={{ label: 'Default', variant: 'default', size: 'md' }} />
          <Badge config={{ label: 'Primary', variant: 'primary', size: 'md' }} />
          <Badge config={{ label: 'Success', variant: 'success', size: 'md' }} />
          <Badge config={{ label: 'Warning', variant: 'warning', size: 'md' }} />
          <Badge config={{ label: 'Error', variant: 'error', size: 'md' }} />
          <Badge config={{ label: 'Info', variant: 'info', size: 'md' }} />
        </Row>

        <SectionLabel label="Badge — sizes" />
        <Row config={{ gap: 8, align: 'center', wrap: true }}>
          <Badge config={{ label: 'Small', variant: 'primary', size: 'sm' }} />
          <Badge config={{ label: 'Medium', variant: 'primary', size: 'md' }} />
          <Badge config={{ label: 'Large', variant: 'primary', size: 'lg' }} />
        </Row>

        <SectionLabel label="Avatar — sizes + shapes" />
        <Row config={{ gap: 12, align: 'center' }}>
          <Avatar config={{ name: 'Alice', size: 'xs' }} />
          <Avatar config={{ name: 'Bob', size: 'sm' }} />
          <Avatar config={{ name: 'Carol', size: 'md' }} />
          <Avatar config={{ name: 'Dave', size: 'lg' }} />
          <Avatar config={{ name: 'Eve', size: 'xl' }} />
        </Row>

        <SectionLabel label="Avatar — shapes" />
        <Row config={{ gap: 12, align: 'center' }}>
          <Avatar config={{ name: 'Circle', size: 'lg', shape: 'circle' }} />
          <Avatar config={{ name: 'Round', size: 'lg', shape: 'rounded' }} />
          <Avatar config={{ name: 'Sq', size: 'lg', shape: 'square' }} />
        </Row>

        <SectionLabel label="Avatar — with image" />
        <Row config={{ gap: 12, align: 'center' }}>
          <Avatar
            config={{
              src: 'https://i.pravatar.cc/150?u=alice',
              name: 'Alice',
              size: 'lg',
            }}
          />
          <Avatar
            config={{
              src: 'https://i.pravatar.cc/150?u=bob',
              name: 'Bob',
              size: 'lg',
            }}
          />
          <Avatar
            config={{
              src: 'https://i.pravatar.cc/150?u=carol',
              name: 'Carol',
              size: 'lg',
            }}
          />
        </Row>

        <SectionLabel label="AvatarGroup" />
        <AvatarGroup
          config={{
            avatars: [
              { name: 'Alice', src: 'https://i.pravatar.cc/150?u=alice' },
              { name: 'Bob', src: 'https://i.pravatar.cc/150?u=bob' },
              { name: 'Carol', src: 'https://i.pravatar.cc/150?u=carol' },
              { name: 'Dave', src: 'https://i.pravatar.cc/150?u=dave' },
              { name: 'Eve', src: 'https://i.pravatar.cc/150?u=eve' },
              { name: 'Frank', src: 'https://i.pravatar.cc/150?u=frank' },
            ],
            maxVisible: 4,
            size: 'md',
          }}
        />

        <SectionLabel label="StatCard — with trends" />
        <Stack config={{ gap: 12 }}>
          <StatCard
            config={{
              label: 'Total Users',
              value: '12,483',
              trend: { direction: 'up', value: '+8.2%' },
            }}
          />
          <StatCard
            config={{
              label: 'Monthly Revenue',
              value: '$48,720',
              trend: { direction: 'up', value: '+14.1%' },
            }}
          />
          <StatCard
            config={{
              label: 'Churn Rate',
              value: '3.4%',
              trend: { direction: 'down', value: '-0.6%' },
            }}
          />
          <StatCard
            config={{
              label: 'Avg Session',
              value: '4m 32s',
              trend: { direction: 'neutral', value: '0%' },
            }}
          />
        </Stack>

        <SectionLabel label="EmptyState — default + with action" />
        <Stack config={{ gap: 12 }}>
          <EmptyState
            config={{
              title: 'No messages yet',
              description: 'Start a conversation to see your messages here.',
              icon: '💬',
            }}
          />
          <EmptyState
            config={{
              title: 'No results found',
              description: 'Try adjusting your search terms.',
              action: {
                label: 'Clear Filters',
                onPress: { type: 'toast', message: 'Filters cleared' },
              },
            }}
          />
        </Stack>

        <SectionLabel label="LoadingState — skeleton (count 3)" />
        <LoadingState config={{ variant: 'skeleton', count: 3, height: 56 }} />

        <SectionLabel label="LoadingState — spinner" />
        <LoadingState config={{ variant: 'spinner' }} />
      </MockProviders>
    </ShowcaseScreen>
  )
}
