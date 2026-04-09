import {
  ProgressBar,
  Stepper,
  Timeline,
  StatusBadge,
  Stack,
  Row,
  Divider,
} from '@lastshotlabs/pocketshot/ui'
import { ShowcaseScreen, SectionLabel } from '@/lib/ShowcaseScreen'
import { MockProviders } from '@/lib/MockProviders'

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
          <ProgressBar config={{ value: 60, height: 4, radius: 'full' }} />
          <ProgressBar config={{ value: 60, height: 8, radius: 'full' }} />
          <ProgressBar config={{ value: 60, height: 16, radius: 'md' }} />
          <ProgressBar config={{ value: 60, height: 24, radius: 'none' }} />
        </Stack>

        <Divider config={{ marginVertical: 4 }} />

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
              { id: 'notifications', label: 'Enable Notifications', description: 'Stay up to date' },
              { id: 'invite', label: 'Invite Team', description: 'Add your colleagues' },
            ],
            currentStep: 'preferences',
            variant: 'vertical',
          }}
        />

        <Divider config={{ marginVertical: 4 }} />

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

        <Divider config={{ marginVertical: 4 }} />

        <SectionLabel label="StatusBadge — with statusMap" />
        <Stack config={{ gap: 8 }}>
          {(['active', 'inactive', 'pending', 'banned', 'verified'] as const).map((s) => (
            <Row key={s} config={{ align: 'center', gap: 8 }}>
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
        <Row config={{ gap: 12, align: 'center' }}>
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
      </MockProviders>
    </ShowcaseScreen>
  )
}
