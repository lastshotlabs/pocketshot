import { useEffect } from 'react'
import {
  ProgressBar,
  Stepper,
  Timeline,
  StatusBadge,
  Calendar,
  AuditLog,
  NotificationFeed,
  KanbanBoard,
  Stack,
  Row,
  Divider,
  useScreenContext,
} from '@lastshotlabs/pocketshot/ui'
import { ShowcaseScreen, SectionLabel } from '@/lib/ShowcaseScreen'
import { MockProviders } from '@/lib/MockProviders'

function WorkflowDemos() {
  const { setValue } = useScreenContext()

  useEffect(() => {
    setValue('auditData', [
      {
        id: '1',
        actor: { name: 'Alice' },
        action: 'created',
        target: 'Invoice #1234',
        createdAt: new Date(Date.now() - 120000).toISOString(),
        severity: 'info',
      },
      {
        id: '2',
        actor: { name: 'Bob' },
        action: 'updated',
        target: 'User Profile',
        detail: 'Changed role from viewer to admin',
        createdAt: new Date(Date.now() - 3600000).toISOString(),
        severity: 'warning',
      },
      {
        id: '3',
        actor: { name: 'Charlie' },
        action: 'deleted',
        target: 'Comment #892',
        createdAt: new Date(Date.now() - 7200000).toISOString(),
        severity: 'error',
      },
      {
        id: '4',
        actor: { name: 'Diana' },
        action: 'approved',
        target: 'Pull Request #47',
        detail: 'Merged to main',
        createdAt: new Date(Date.now() - 86400000).toISOString(),
        severity: 'info',
      },
      {
        id: '5',
        actor: { name: 'Eve' },
        action: 'exported',
        target: 'Q1 Report',
        createdAt: new Date(Date.now() - 172800000).toISOString(),
        severity: 'info',
      },
    ])

    setValue('notificationData', [
      {
        id: 'n1',
        title: 'New comment on your post',
        body: 'Alice replied to "Quarterly Review"',
        type: 'comment',
        read: false,
        createdAt: new Date(Date.now() - 60000).toISOString(),
      },
      {
        id: 'n2',
        title: 'You were mentioned',
        body: 'Bob mentioned you in #general',
        type: 'mention',
        read: false,
        createdAt: new Date(Date.now() - 1800000).toISOString(),
      },
      {
        id: 'n3',
        title: 'Task assigned to you',
        body: 'Charlie assigned "Fix login bug" to you',
        type: 'task',
        read: true,
        createdAt: new Date(Date.now() - 7200000).toISOString(),
      },
      {
        id: 'n4',
        title: 'Deployment succeeded',
        body: 'Production deploy v2.4.1 completed',
        type: 'system',
        read: true,
        createdAt: new Date(Date.now() - 86400000).toISOString(),
      },
      {
        id: 'n5',
        title: 'Invitation accepted',
        body: 'Diana joined the workspace',
        type: 'social',
        read: false,
        createdAt: new Date(Date.now() - 43200000).toISOString(),
      },
      {
        id: 'n6',
        title: 'Weekly digest',
        body: '12 updates in your projects this week',
        type: 'digest',
        read: true,
        createdAt: new Date(Date.now() - 172800000).toISOString(),
      },
    ])
  }, [setValue])

  const now = new Date()
  const year = now.getFullYear()
  const month = String(now.getMonth() + 1).padStart(2, '0')

  return (
    <>
      <SectionLabel label="Calendar — with events and navigation" />
      <Calendar
        config={{
          id: 'cal-nav',
          showNavigation: true,
          mode: 'single',
          events: [
            { date: `${year}-${month}-03`, title: 'Team standup', color: '#2563eb' },
            { date: `${year}-${month}-10`, title: 'Sprint review', color: '#16a34a' },
            { date: `${year}-${month}-15`, title: 'Design sync', color: '#9333ea' },
            { date: `${year}-${month}-21`, title: 'Release day', color: '#dc2626' },
            { date: `${year}-${month}-27`, title: 'Retro', color: '#f59e0b' },
          ],
          testID: 'calendar-nav',
        }}
      />

      <SectionLabel label="Calendar — no navigation" />
      <Calendar
        config={{
          id: 'cal-static',
          showNavigation: false,
          mode: 'single',
          events: [
            { date: `${year}-${month}-05`, title: 'Kickoff meeting' },
            { date: `${year}-${month}-12`, title: 'Client call' },
            { date: `${year}-${month}-18`, title: 'Deadline' },
            { date: `${year}-${month}-22`, title: 'All hands' },
            { date: `${year}-${month}-28`, title: 'Demo day' },
          ],
          testID: 'calendar-static',
        }}
      />

      <Divider config={{ marginY: 4 }} />

      <SectionLabel label="AuditLog — grouped by date" />
      <AuditLog
        config={{
          id: 'audit-demo',
          data: { from: 'auditData' },
          groupByDate: true,
          showActor: true,
          testID: 'audit-log',
        }}
      />

      <Divider config={{ marginY: 4 }} />

      <SectionLabel label="NotificationFeed — with mark all read" />
      <NotificationFeed
        config={{
          id: 'notif-demo',
          data: { from: 'notificationData' },
          showMarkAllRead: true,
          refreshable: true,
          testID: 'notification-feed',
        }}
      />

      <Divider config={{ marginY: 4 }} />

      <SectionLabel label="KanbanBoard — 3 columns with cards" />
      <KanbanBoard
        config={{
          id: 'kanban-demo',
          columns: [
            {
              id: 'todo',
              title: 'To Do',
              color: '#6366f1',
              items: [
                {
                  id: 'task-1',
                  title: 'Design token audit',
                  description: 'Review all color tokens for dark mode compliance',
                  tags: ['design', 'tokens'],
                  priority: 'high',
                  assignee: { name: 'Alice' },
                },
                {
                  id: 'task-2',
                  title: 'Write E2E tests for auth flow',
                  description: 'Cover login, register, MFA, and password reset',
                  tags: ['testing'],
                  priority: 'medium',
                  assignee: { name: 'Bob' },
                },
                {
                  id: 'task-3',
                  title: 'Add haptic feedback to buttons',
                  tags: ['enhancement'],
                  priority: 'low',
                },
              ],
            },
            {
              id: 'in-progress',
              title: 'In Progress',
              color: '#f59e0b',
              items: [
                {
                  id: 'task-4',
                  title: 'Kanban board component',
                  description: 'Implement drag-and-drop card movement',
                  tags: ['ui', 'feature'],
                  priority: 'high',
                  assignee: { name: 'Charlie' },
                },
                {
                  id: 'task-5',
                  title: 'Offline sync improvements',
                  description: 'Handle conflict resolution for concurrent edits',
                  tags: ['offline'],
                  priority: 'urgent',
                  assignee: { name: 'Diana' },
                },
              ],
            },
            {
              id: 'done',
              title: 'Done',
              color: '#16a34a',
              items: [
                {
                  id: 'task-6',
                  title: 'Bottom sheet animations',
                  description: 'Reanimated enter/exit transitions',
                  tags: ['ui', 'animation'],
                  priority: 'medium',
                  assignee: { name: 'Eve' },
                },
                {
                  id: 'task-7',
                  title: 'Push notification setup',
                  tags: ['infra'],
                  priority: 'high',
                  assignee: { name: 'Alice' },
                },
              ],
            },
          ],
          onItemPress: { type: 'toast', message: 'Card tapped' },
          testID: 'kanban-demo',
        }}
      />
    </>
  )
}

export default function WorkflowShowcase() {
  return (
    <ShowcaseScreen title="Workflow">
      <MockProviders>
        <SectionLabel label="ProgressBar — variants" />
        <Stack config={{ gap: 12 }}>
          <ProgressBar
            config={{
              value: 72,
              label: 'Upload progress',
              showValue: true,
              variant: 'default',
              animated: true,
            }}
          />
          <ProgressBar
            config={{
              value: 100,
              label: 'Build passed',
              showValue: true,
              variant: 'success',
            }}
          />
          <ProgressBar
            config={{
              value: 45,
              label: 'Storage usage',
              showValue: true,
              variant: 'warning',
            }}
          />
          <ProgressBar
            config={{
              value: 92,
              label: 'Memory critical',
              showValue: true,
              variant: 'error',
            }}
          />
        </Stack>

        <SectionLabel label="ProgressBar — height + radius variants" />
        <Stack config={{ gap: 12 }}>
          <ProgressBar config={{ value: 60, height: 4, borderRadius: 'full' }} />
          <ProgressBar config={{ value: 60, height: 8, borderRadius: 'full' }} />
          <ProgressBar config={{ value: 60, height: 16, borderRadius: 'md' }} />
          <ProgressBar config={{ value: 60, height: 24, borderRadius: 'none' }} />
        </Stack>

        <Divider config={{ marginY: 4 }} />

        <SectionLabel label="Stepper — horizontal (checkout)" />
        <Stepper
          config={{
            id: 'checkout-steps',
            steps: [
              { id: 'cart', label: 'Cart', description: 'Review items' },
              { id: 'shipping', label: 'Shipping', description: 'Enter address' },
              { id: 'payment', label: 'Payment', description: 'Enter card details' },
              { id: 'confirm', label: 'Confirm', description: 'Place order' },
            ],
            currentStep: 'payment',
            variant: 'horizontal',
          }}
        />

        <SectionLabel label="Stepper — vertical (onboarding)" />
        <Stepper
          config={{
            id: 'onboarding-steps',
            steps: [
              { id: 'profile', label: 'Create Profile', description: 'Set your name and photo' },
              { id: 'preferences', label: 'Set Preferences', description: 'Choose your interests' },
              {
                id: 'notifications',
                label: 'Enable Notifications',
                description: 'Stay up to date',
              },
              { id: 'invite', label: 'Invite Team', description: 'Add your colleagues' },
            ],
            currentStep: 'preferences',
            variant: 'vertical',
          }}
        />

        <Divider config={{ marginY: 4 }} />

        <SectionLabel label="Timeline — order history" />
        <Timeline
          config={{
            items: [
              {
                id: 'delivered',
                title: 'Package delivered',
                description: 'Left at front door',
                timestamp: 'Apr 8, 2026 · 2:14 PM',
                icon: '📦',
                color: '#16a34a',
              },
              {
                id: 'out-for-delivery',
                title: 'Out for delivery',
                description: 'Driver: John D. — ETA 2:00 PM',
                timestamp: 'Apr 8, 2026 · 9:30 AM',
                icon: '🚚',
                color: '#2563eb',
              },
              {
                id: 'arrived-facility',
                title: 'Arrived at local facility',
                description: 'San Francisco, CA',
                timestamp: 'Apr 7, 2026 · 11:45 PM',
                icon: '🏭',
              },
              {
                id: 'in-transit',
                title: 'In transit',
                description: 'Left Phoenix, AZ',
                timestamp: 'Apr 6, 2026 · 3:20 PM',
                icon: '✈️',
              },
              {
                id: 'shipped',
                title: 'Order shipped',
                description: 'Tracking: 1Z999AA10123456784',
                timestamp: 'Apr 5, 2026 · 10:00 AM',
                icon: '📬',
              },
              {
                id: 'ordered',
                title: 'Order placed',
                description: 'Payment confirmed',
                timestamp: 'Apr 4, 2026 · 3:45 PM',
                icon: '🛒',
              },
            ],
          }}
        />

        <Divider config={{ marginY: 4 }} />

        <SectionLabel label="StatusBadge — with statusMap" />
        <Stack config={{ gap: 8 }}>
          {(['active', 'inactive', 'pending', 'banned', 'verified'] as const).map((s) => (
            <Row key={s} config={{ alignItems: 'center', gap: 8 }}>
              <StatusBadge
                config={{
                  status: s,
                  statusMap: {
                    active: { label: 'Active', color: 'success' },
                    inactive: { label: 'Inactive', color: 'default' },
                    pending: { label: 'Pending Review', color: 'warning' },
                    banned: { label: 'Banned', color: 'error' },
                    verified: { label: 'Verified', color: 'info' },
                  },
                  showDot: true,
                  size: 'md',
                }}
              />
            </Row>
          ))}
        </Stack>

        <SectionLabel label="StatusBadge — sizes" />
        <Row config={{ gap: 12, alignItems: 'center' }}>
          <StatusBadge
            config={{
              status: 'active',
              statusMap: { active: { label: 'Active', color: 'success' } },
              size: 'sm',
            }}
          />
          <StatusBadge
            config={{
              status: 'active',
              statusMap: { active: { label: 'Active', color: 'success' } },
              size: 'md',
            }}
          />
        </Row>

        <SectionLabel label="StatusBadge — no dot" />
        <StatusBadge
          config={{
            status: 'pending',
            statusMap: { pending: { label: 'Pending Approval', color: 'warning' } },
            showDot: false,
          }}
        />

        <Divider config={{ marginY: 4 }} />

        <WorkflowDemos />
      </MockProviders>
    </ShowcaseScreen>
  )
}
