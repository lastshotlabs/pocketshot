import {
  TextInput,
  Checkbox,
  Switch,
  Slider,
  Select,
  AutoForm,
  Stack,
  Row,
  Button,
  Textarea,
  Toggle,
  MultiSelect,
  TagSelector,
  InlineEdit,
  Wizard,
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
        <SectionLabel label="Button — variants" />
        <Stack config={{ gap: 12 }}>
          <Button
            config={{
              label: 'Primary',
              variant: 'primary',
              onPress: { type: 'toast', message: 'Primary button pressed' },
            }}
          />
          <Button
            config={{
              label: 'Secondary',
              variant: 'secondary',
              onPress: { type: 'toast', message: 'Secondary button pressed' },
            }}
          />
          <Button
            config={{
              label: 'Ghost',
              variant: 'ghost',
              onPress: { type: 'toast', message: 'Ghost button pressed' },
            }}
          />
          <Button
            config={{
              label: 'Outline',
              variant: 'outline',
              onPress: { type: 'toast', message: 'Outline button pressed' },
            }}
          />
          <Button
            config={{
              label: 'Destructive',
              variant: 'destructive',
              onPress: { type: 'toast', message: 'Destructive button pressed' },
            }}
          />
        </Stack>

        <SectionLabel label="Button — sizes" />
        <Row config={{ gap: 12, align: 'center' }}>
          <Button
            config={{
              label: 'Small',
              size: 'sm',
              onPress: { type: 'toast', message: 'Small pressed' },
            }}
          />
          <Button
            config={{
              label: 'Medium',
              size: 'md',
              onPress: { type: 'toast', message: 'Medium pressed' },
            }}
          />
          <Button
            config={{
              label: 'Large',
              size: 'lg',
              onPress: { type: 'toast', message: 'Large pressed' },
            }}
          />
        </Row>

        <SectionLabel label="Button — states" />
        <Stack config={{ gap: 12 }}>
          <Button
            config={{
              label: 'Loading...',
              loading: true,
              onPress: { type: 'toast', message: 'Should not fire' },
            }}
          />
          <Button
            config={{
              label: 'Disabled',
              disabled: true,
              onPress: { type: 'toast', message: 'Should not fire' },
            }}
          />
          <Button
            config={{
              label: 'Full Width Button',
              fullWidth: true,
              onPress: { type: 'toast', message: 'Full width pressed' },
            }}
          />
        </Stack>

        <SectionLabel label="Button — with icons" />
        <Stack config={{ gap: 12 }}>
          <Button
            config={{
              label: 'Add to Cart',
              iconLeft: 'shopping-cart',
              onPress: { type: 'toast', message: 'Added to cart' },
            }}
          />
          <Button
            config={{
              label: 'Continue',
              iconRight: 'arrow-right',
              variant: 'outline',
              onPress: { type: 'toast', message: 'Continuing...' },
            }}
          />
          <Button
            config={{
              label: 'Delete Account',
              iconLeft: 'trash-2',
              variant: 'destructive',
              onPress: { type: 'toast', message: 'Account deletion initiated' },
            }}
          />
        </Stack>

        <SectionLabel label="Textarea — basic" />
        <Stack config={{ gap: 12 }}>
          <Textarea
            config={{
              id: 'feedback',
              label: 'Feedback',
              placeholder: 'Tell us what you think...',
            }}
          />
          <Textarea
            config={{
              id: 'notes',
              label: 'Meeting Notes',
              placeholder: 'Write your notes here...',
              maxLength: 500,
              showCharCount: true,
            }}
          />
          <Textarea
            config={{
              id: 'error-textarea',
              label: 'Description',
              placeholder: 'Enter a description...',
              errorText: 'Description is required',
            }}
          />
        </Stack>

        <SectionLabel label="Toggle — variants" />
        <Stack config={{ gap: 12 }}>
          <Toggle
            config={{
              id: 'toggle-default',
              label: 'Default Toggle',
              variant: 'default',
            }}
          />
          <Toggle
            config={{
              id: 'toggle-primary',
              label: 'Primary Toggle',
              variant: 'primary',
              defaultValue: true,
            }}
          />
          <Toggle
            config={{
              id: 'toggle-outline',
              label: 'Outline Toggle',
              variant: 'outline',
            }}
          />
        </Stack>

        <SectionLabel label="Toggle — sizes and states" />
        <Stack config={{ gap: 12 }}>
          <Row config={{ gap: 16, align: 'center' }}>
            <Toggle config={{ id: 'toggle-sm', label: 'Small', size: 'sm', defaultValue: true }} />
            <Toggle config={{ id: 'toggle-md', label: 'Medium', size: 'md', defaultValue: true }} />
            <Toggle config={{ id: 'toggle-lg', label: 'Large', size: 'lg', defaultValue: true }} />
          </Row>
          <Toggle
            config={{
              id: 'toggle-disabled',
              label: 'Disabled Toggle',
              disabled: true,
              defaultValue: true,
            }}
          />
          <Toggle
            config={{
              id: 'toggle-icon',
              icon: 'bell',
              label: 'Enable Notifications',
              variant: 'primary',
            }}
          />
        </Stack>

        <SectionLabel label="MultiSelect" />
        <MultiSelect
          config={{
            id: 'skills',
            label: 'Skills',
            placeholder: 'Select your skills...',
            options: [
              { value: 'react', label: 'React' },
              { value: 'typescript', label: 'TypeScript' },
              { value: 'node', label: 'Node.js' },
              { value: 'python', label: 'Python' },
              { value: 'rust', label: 'Rust' },
              { value: 'go', label: 'Go' },
              { value: 'swift', label: 'Swift' },
              { value: 'kotlin', label: 'Kotlin' },
            ],
            defaultValue: ['react', 'typescript'],
            onChangeAction: { type: 'toast', message: 'Skills updated' },
          }}
        />

        <SectionLabel label="TagSelector" />
        <TagSelector
          config={{
            id: 'labels',
            label: 'Issue Labels',
            availableTags: [
              { id: 'bug', label: 'Bug', color: '#ef4444' },
              { id: 'feature', label: 'Feature', color: '#3b82f6' },
              { id: 'docs', label: 'Documentation', color: '#8b5cf6' },
              { id: 'perf', label: 'Performance', color: '#f59e0b' },
              { id: 'security', label: 'Security', color: '#ec4899' },
              { id: 'ux', label: 'UX', color: '#10b981' },
              { id: 'a11y', label: 'Accessibility', color: '#06b6d4' },
              { id: 'infra', label: 'Infrastructure', color: '#6366f1' },
              { id: 'testing', label: 'Testing', color: '#84cc16' },
            ],
            defaultValue: ['bug', 'feature', 'docs'],
            maxTags: 5,
            onChangeAction: { type: 'toast', message: 'Labels updated' },
          }}
        />

        <SectionLabel label="InlineEdit" />
        <Stack config={{ gap: 12 }}>
          <InlineEdit
            config={{
              id: 'project-name',
              defaultValue: 'My Project',
              placeholder: 'Enter project name',
              onSaveAction: { type: 'toast', message: 'Project name saved' },
            }}
          />
          <InlineEdit
            config={{
              id: 'price',
              defaultValue: '49.99',
              inputType: 'number',
              prefix: '$',
              onSaveAction: { type: 'toast', message: 'Price updated' },
            }}
          />
        </Stack>

        <SectionLabel label="Wizard" />
        <Wizard
          config={{
            id: 'onboarding-wizard',
            title: 'Create Your Profile',
            showProgress: true,
            steps: [
              {
                id: 'personal',
                title: 'Personal Info',
                description: 'Tell us a bit about yourself',
                fields: [
                  { id: 'first-name', type: 'text', label: 'First Name', placeholder: 'Jane', required: true },
                  { id: 'last-name', type: 'text', label: 'Last Name', placeholder: 'Doe', required: true },
                  { id: 'email', type: 'email', label: 'Email', placeholder: 'jane@example.com', required: true },
                ],
              },
              {
                id: 'preferences',
                title: 'Preferences',
                description: 'Customize your experience',
                fields: [
                  {
                    id: 'role',
                    type: 'select',
                    label: 'Role',
                    required: true,
                    options: [
                      { value: 'developer', label: 'Developer' },
                      { value: 'designer', label: 'Designer' },
                      { value: 'product', label: 'Product Manager' },
                      { value: 'other', label: 'Other' },
                    ],
                  },
                  { id: 'bio', type: 'textarea', label: 'Bio', placeholder: 'A few words about you...', helperText: 'Optional but recommended' },
                  { id: 'newsletter', type: 'checkbox', label: 'Subscribe to product updates', defaultValue: true },
                ],
              },
              {
                id: 'review',
                title: 'Review',
                description: 'Confirm your details before submitting',
                fields: [
                  { id: 'terms', type: 'checkbox', label: 'I agree to the Terms of Service', required: true },
                  { id: 'privacy', type: 'checkbox', label: 'I accept the Privacy Policy', required: true },
                ],
              },
            ],
            onComplete: { type: 'toast', message: 'Profile created successfully!' },
            onCancel: { type: 'toast', message: 'Wizard cancelled' },
          }}
        />
      </MockProviders>
    </ShowcaseScreen>
  )
}
