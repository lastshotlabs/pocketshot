import { useEffect } from 'react'
import {
  Badge,
  Avatar,
  AvatarGroup,
  StatCard,
  EmptyState,
  LoadingState,
  Alert,
  Tooltip,
  SaveIndicator,
  HighlightedText,
  DataTable,
  DetailCard,
  FilterBar,
  FavoriteButton,
  NotificationBell,
  Chart,
  EntityPicker,
  Stack,
  Row,
  useScreenContext,
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

        {/* ── Alert ─────────────────────────────────────────────────────── */}
        <SectionLabel label="Alert — variants" />
        <Stack config={{ gap: 8 }}>
          <Alert config={{ title: 'System update available', variant: 'default' }} />
          <Alert
            config={{
              title: 'Payment received',
              body: 'Your invoice #4821 has been paid successfully.',
              variant: 'success',
            }}
          />
          <Alert
            config={{
              title: 'Storage almost full',
              body: 'You have used 92% of your available storage.',
              variant: 'warning',
            }}
          />
          <Alert
            config={{
              title: 'Connection failed',
              body: 'Unable to reach the server. Check your network settings.',
              variant: 'error',
            }}
          />
          <Alert
            config={{
              title: 'Scheduled maintenance',
              body: 'The platform will be briefly unavailable on April 12 at 2:00 AM UTC.',
              variant: 'info',
            }}
          />
        </Stack>

        <SectionLabel label="Alert — dismissible + action" />
        <Stack config={{ gap: 8 }}>
          <Alert
            config={{
              title: 'New feature available',
              body: 'Team dashboards are now live for all Pro plans.',
              variant: 'info',
              dismissible: true,
              onDismiss: { type: 'toast', message: 'Alert dismissed' },
            }}
          />
          <Alert
            config={{
              title: 'Your trial expires in 3 days',
              body: 'Upgrade now to keep access to all features.',
              variant: 'warning',
              action: {
                label: 'Upgrade Plan',
                onPress: { type: 'toast', message: 'Navigating to upgrade' },
              },
            }}
          />
        </Stack>

        {/* ── Tooltip ───────────────────────────────────────────────────── */}
        <SectionLabel label="Tooltip — positions" />
        <Row config={{ gap: 24, justify: 'center' }}>
          <Tooltip config={{ trigger: 'Top', content: 'Tooltip on top', position: 'top' }} />
          <Tooltip
            config={{ trigger: 'Bottom', content: 'Tooltip on bottom', position: 'bottom' }}
          />
          <Tooltip config={{ trigger: 'Left', content: 'Tooltip on left', position: 'left' }} />
          <Tooltip
            config={{ trigger: 'Right', content: 'Tooltip on right', position: 'right' }}
          />
        </Row>

        {/* ── SaveIndicator ─────────────────────────────────────────────── */}
        <SectionLabel label="SaveIndicator — all states" />
        <Row config={{ gap: 16 }}>
          <SaveIndicator config={{ status: 'idle', idleLabel: 'Idle' }} />
          <SaveIndicator config={{ status: 'saving' }} />
          <SaveIndicator config={{ status: 'saved' }} />
          <SaveIndicator config={{ status: 'error' }} />
        </Row>

        {/* ── HighlightedText ───────────────────────────────────────────── */}
        <SectionLabel label="HighlightedText — search matches" />
        <Stack config={{ gap: 8 }}>
          <HighlightedText
            config={{
              text: 'React Native enables building native mobile apps using JavaScript and React.',
              highlights: ['React', 'native', 'mobile'],
              fontSize: 'md',
            }}
          />
          <HighlightedText
            config={{
              text: 'The design token system powers consistent theming across all components.',
              highlights: ['design token', 'theming', 'components'],
              fontSize: 'sm',
            }}
          />
        </Stack>

        {/* ── DataTable ─────────────────────────────────────────────────── */}
        <SectionLabel label="DataTable — sortable columns" />
        <DataTableDemo />

        {/* ── DetailCard ────────────────────────────────────────────────── */}
        <SectionLabel label="DetailCard — user profile" />
        <DetailCard
          config={{
            title: 'Sarah Chen',
            subtitle: 'Senior Product Designer',
            sections: [
              {
                title: 'Personal Info',
                fields: [
                  { label: 'Full Name', value: 'Sarah Chen', type: 'text' },
                  { label: 'Role', value: 'Senior Product Designer', type: 'badge' },
                  { label: 'Joined', value: '2024-03-15', type: 'date' },
                ],
              },
              {
                title: 'Contact',
                fields: [
                  { label: 'Email', value: 'sarah.chen@acme.co', type: 'email' },
                  { label: 'Phone', value: '+1 (415) 555-0192', type: 'phone' },
                  { label: 'Portfolio', value: 'https://sarahchen.design', type: 'link' },
                ],
              },
              {
                title: 'Account',
                fields: [
                  { label: 'Plan', value: 'Pro', type: 'badge' },
                  { label: 'Status', value: 'Active', type: 'text' },
                  { label: 'Last Login', value: '2026-04-08', type: 'date' },
                ],
              },
            ],
            onEditPress: { type: 'toast', message: 'Edit profile tapped' },
          }}
        />

        {/* ── FilterBar ─────────────────────────────────────────────────── */}
        <SectionLabel label="FilterBar — single select" />
        <FilterBar
          config={{
            filters: [
              { id: 'all-tasks', label: 'All Tasks', count: 42 },
              { id: 'active', label: 'Active', count: 18 },
              { id: 'completed', label: 'Completed', count: 20 },
              { id: 'archived', label: 'Archived', count: 4 },
            ],
            defaultValue: 'active',
            showAllOption: false,
            onChangeAction: { type: 'toast', message: 'Filter changed' },
          }}
        />

        <SectionLabel label="FilterBar — multi-select" />
        <FilterBar
          config={{
            filters: [
              { id: 'design', label: 'Design', count: 12 },
              { id: 'engineering', label: 'Engineering', count: 28 },
              { id: 'marketing', label: 'Marketing', count: 9 },
              { id: 'sales', label: 'Sales', count: 15 },
              { id: 'support', label: 'Support', count: 7 },
              { id: 'ops', label: 'Operations', count: 5 },
            ],
            multiSelect: true,
            defaultValue: ['design', 'engineering'],
            onChangeAction: { type: 'toast', message: 'Filters updated' },
          }}
        />

        {/* ── FavoriteButton ────────────────────────────────────────────── */}
        <SectionLabel label="FavoriteButton — heart variant (sm, md, lg)" />
        <Row config={{ gap: 16, align: 'center' }}>
          <FavoriteButton
            config={{
              id: 'fav-heart-sm',
              variant: 'heart',
              size: 'sm',
              onToggleAction: { type: 'toast', message: 'Heart toggled' },
            }}
          />
          <FavoriteButton
            config={{
              id: 'fav-heart-md',
              variant: 'heart',
              size: 'md',
              defaultValue: true,
              onToggleAction: { type: 'toast', message: 'Heart toggled' },
            }}
          />
          <FavoriteButton
            config={{
              id: 'fav-heart-lg',
              variant: 'heart',
              size: 'lg',
              onToggleAction: { type: 'toast', message: 'Heart toggled' },
            }}
          />
        </Row>

        <SectionLabel label="FavoriteButton — star variant (sm, md, lg)" />
        <Row config={{ gap: 16, align: 'center' }}>
          <FavoriteButton
            config={{
              id: 'fav-star-sm',
              variant: 'star',
              size: 'sm',
              onToggleAction: { type: 'toast', message: 'Star toggled' },
            }}
          />
          <FavoriteButton
            config={{
              id: 'fav-star-md',
              variant: 'star',
              size: 'md',
              defaultValue: true,
              onToggleAction: { type: 'toast', message: 'Star toggled' },
            }}
          />
          <FavoriteButton
            config={{
              id: 'fav-star-lg',
              variant: 'star',
              size: 'lg',
              onToggleAction: { type: 'toast', message: 'Star toggled' },
            }}
          />
        </Row>

        {/* ── NotificationBell ──────────────────────────────────────────── */}
        <SectionLabel label="NotificationBell — counts" />
        <Row config={{ gap: 24, align: 'center' }}>
          <NotificationBell
            config={{
              id: 'bell-zero',
              count: 0,
              onPress: { type: 'toast', message: 'Notifications tapped' },
            }}
          />
          <NotificationBell
            config={{
              id: 'bell-five',
              count: 5,
              onPress: { type: 'toast', message: 'Notifications tapped' },
            }}
          />
          <NotificationBell
            config={{
              id: 'bell-overflow',
              count: 150,
              maxCount: 99,
              onPress: { type: 'toast', message: 'Notifications tapped' },
            }}
          />
        </Row>

        {/* ── Chart ─────────────────────────────────────────────────────── */}
        <SectionLabel label="Chart — bar" />
        <Chart
          config={{
            type: 'bar',
            title: 'Monthly Revenue ($k)',
            data: [
              { label: 'Jan', value: 42 },
              { label: 'Feb', value: 58 },
              { label: 'Mar', value: 51 },
              { label: 'Apr', value: 73 },
              { label: 'May', value: 65 },
            ],
            showLabels: true,
            showValues: true,
            height: 220,
          }}
        />

        <SectionLabel label="Chart — line" />
        <Chart
          config={{
            type: 'line',
            title: 'Active Users',
            data: [
              { label: 'Mon', value: 1200 },
              { label: 'Tue', value: 1450 },
              { label: 'Wed', value: 1380 },
              { label: 'Thu', value: 1620 },
              { label: 'Fri', value: 1510 },
              { label: 'Sat', value: 980 },
            ],
            showLabels: true,
            showValues: false,
            height: 220,
          }}
        />

        {/* ── EntityPicker ──────────────────────────────────────────────── */}
        <SectionLabel label="EntityPicker — with options" />
        <EntityPicker
          config={{
            id: 'picker-team',
            label: 'Assign to team member',
            placeholder: 'Select a person',
            searchPlaceholder: 'Search team members',
            data: [
              { value: 'alice', label: 'Alice Johnson', subtitle: 'Engineering' },
              { value: 'bob', label: 'Bob Martinez', subtitle: 'Design' },
              { value: 'carol', label: 'Carol Park', subtitle: 'Product' },
              { value: 'dave', label: 'Dave Kim', subtitle: 'Marketing' },
              { value: 'eve', label: 'Eve Nakamura', subtitle: 'Engineering' },
            ],
            onChangeAction: { type: 'toast', message: 'Team member selected' },
          }}
        />

        <SectionLabel label="EntityPicker — with pre-selected value" />
        <EntityPicker
          config={{
            id: 'picker-project',
            label: 'Project',
            placeholder: 'Choose a project',
            data: [
              { value: 'atlas', label: 'Atlas', subtitle: 'Infrastructure' },
              { value: 'beacon', label: 'Beacon', subtitle: 'Analytics' },
              { value: 'compass', label: 'Compass', subtitle: 'Navigation' },
              { value: 'drift', label: 'Drift', subtitle: 'Messaging' },
            ],
            defaultValue: 'beacon',
            onChangeAction: { type: 'toast', message: 'Project changed' },
          }}
        />
      </MockProviders>
    </ShowcaseScreen>
  )
}

function DataTableDemo() {
  const { setValue } = useScreenContext()

  useEffect(() => {
    setValue('showcaseTableData', [
      { id: '1', name: 'Alice Johnson', role: 'Admin', status: 'Active', lastSeen: '2 hours ago' },
      {
        id: '2',
        name: 'Bob Martinez',
        role: 'Editor',
        status: 'Active',
        lastSeen: '5 minutes ago',
      },
      {
        id: '3',
        name: 'Carol Park',
        role: 'Viewer',
        status: 'Inactive',
        lastSeen: '3 days ago',
      },
      { id: '4', name: 'Dave Kim', role: 'Editor', status: 'Active', lastSeen: '1 hour ago' },
    ])
  }, [])

  return (
    <DataTable
      config={{
        data: { from: 'showcaseTableData' },
        columns: [
          { key: 'name', label: 'Name', sortable: true, flex: 2 },
          { key: 'role', label: 'Role', sortable: true, flex: 1 },
          { key: 'status', label: 'Status', sortable: true, flex: 1 },
          { key: 'lastSeen', label: 'Last Seen', flex: 1 },
        ],
        onRowPress: { type: 'toast', message: 'Row pressed' },
      }}
    />
  )
}
