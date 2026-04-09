import {
  TextInput,
  Checkbox,
  Switch,
  Slider,
  Select,
  AutoForm,
  Stack,
} from '@lastshotlabs/pocketshot/ui'
import { ShowcaseScreen, SectionLabel } from '@/lib/ShowcaseScreen'
import { MockProviders } from '@/lib/MockProviders'

export default function FormsShowcase() {
  return (
    <ShowcaseScreen title="Forms">
      <MockProviders>
        <SectionLabel label="TextInput — variants" />
        <Stack config={{ gap: 12 }}>
          <TextInput
            config={{
              id: 'name',
              label: 'Full Name',
              placeholder: 'John Doe',
              autoCapitalize: 'words',
            }}
          />
          <TextInput
            config={{
              id: 'email',
              label: 'Email Address',
              placeholder: 'you@example.com',
              keyboardType: 'email-address',
              autoCapitalize: 'none',
            }}
          />
          <TextInput
            config={{
              id: 'password',
              label: 'Password',
              placeholder: 'Enter password',
              secureTextEntry: true,
            }}
          />
          <TextInput
            config={{
              id: 'bio',
              label: 'Bio',
              placeholder: 'Tell us about yourself...',
              multiline: true,
              numberOfLines: 4,
            }}
          />
          <TextInput
            config={{
              id: 'phone',
              label: 'Phone',
              placeholder: '+1 (555) 000-0000',
              keyboardType: 'phone-pad',
              helperText: 'Include country code',
            }}
          />
          <TextInput
            config={{
              id: 'error-field',
              label: 'Username',
              placeholder: 'Enter username',
              errorText: 'Username is already taken',
            }}
          />
        </Stack>

        <SectionLabel label="Select" />
        <Stack config={{ gap: 12 }}>
          <Select
            config={{
              id: 'country',
              label: 'Country',
              placeholder: 'Select your country',
              options: [
                { label: 'United States', value: 'us' },
                { label: 'United Kingdom', value: 'gb' },
                { label: 'Canada', value: 'ca' },
                { label: 'Australia', value: 'au' },
                { label: 'Germany', value: 'de' },
              ],
            }}
          />
          <Select
            config={{
              id: 'plan',
              label: 'Subscription Plan',
              options: [
                { label: 'Free', value: 'free' },
                { label: 'Pro — $9/mo', value: 'pro' },
                { label: 'Team — $29/mo', value: 'team' },
                { label: 'Enterprise', value: 'enterprise' },
              ],
              value: 'pro',
            }}
          />
        </Stack>

        <SectionLabel label="Checkbox" />
        <Stack config={{ gap: 8 }}>
          <Checkbox
            config={{
              id: 'terms',
              label: 'I agree to the Terms of Service',
              defaultChecked: false,
            }}
          />
          <Checkbox
            config={{
              id: 'newsletter',
              label: 'Subscribe to newsletter',
              defaultChecked: true,
            }}
          />
          <Checkbox
            config={{
              id: 'disabled-check',
              label: 'Disabled option (unavailable)',
              disabled: true,
            }}
          />
        </Stack>

        <SectionLabel label="Switch" />
        <Stack config={{ gap: 8 }}>
          <Switch
            config={{
              id: 'notifications',
              label: 'Push Notifications',
              defaultValue: true,
            }}
          />
          <Switch
            config={{
              id: 'dark-mode',
              label: 'Dark Mode',
              defaultValue: false,
            }}
          />
          <Switch
            config={{
              id: 'analytics',
              label: 'Analytics (disabled)',
              disabled: true,
            }}
          />
        </Stack>

        <SectionLabel label="Slider" />
        <Stack config={{ gap: 12 }}>
          <Slider
            config={{
              id: 'volume',
              label: 'Volume',
              min: 0,
              max: 100,
              defaultValue: 70,
              showValue: true,
            }}
          />
          <Slider
            config={{
              id: 'brightness',
              label: 'Brightness',
              min: 10,
              max: 100,
              step: 10,
              defaultValue: 80,
              showValue: true,
            }}
          />
          <Slider
            config={{
              id: 'price-range',
              label: 'Max Price',
              min: 0,
              max: 1000,
              step: 50,
              defaultValue: 500,
              showValue: true,
            }}
          />
        </Stack>

        <SectionLabel label="AutoForm — contact form" />
        <AutoForm
          config={{
            id: 'contact-form',
            fields: [
              { id: 'name', type: 'text', label: 'Name', placeholder: 'Your name', required: true },
              { id: 'email', type: 'email', label: 'Email', placeholder: 'you@example.com', required: true },
              { id: 'subject', type: 'select', label: 'Subject', required: true, options: [
                { label: 'General Inquiry', value: 'general' },
                { label: 'Bug Report', value: 'bug' },
                { label: 'Feature Request', value: 'feature' },
              ]},
              { id: 'message', type: 'text', label: 'Message', placeholder: 'Describe your question...', required: true },
              { id: 'subscribe', type: 'checkbox', label: 'Send me updates', defaultValue: false },
            ],
            submitLabel: 'Send Message',
            onSubmit: { type: 'toast', message: 'Message sent!' },
          }}
        />

        <SectionLabel label="AutoForm — registration" />
        <AutoForm
          config={{
            id: 'reg-form',
            fields: [
              { id: 'username', type: 'text', label: 'Username', placeholder: 'your_handle', required: true },
              { id: 'email', type: 'email', label: 'Email', placeholder: 'you@example.com', required: true },
              { id: 'password', type: 'password', label: 'Password', placeholder: 'Min 8 characters', required: true },
              { id: 'role', type: 'select', label: 'Role', options: [
                { label: 'Developer', value: 'dev' },
                { label: 'Designer', value: 'design' },
                { label: 'Manager', value: 'mgr' },
              ]},
              { id: 'terms', type: 'checkbox', label: 'I agree to the Terms of Service', required: true },
            ],
            submitLabel: 'Create Account',
            onSubmit: { type: 'toast', message: 'Account created!' },
          }}
        />
      </MockProviders>
    </ShowcaseScreen>
  )
}
