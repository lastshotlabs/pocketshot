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
  PasswordInput,
  CheckboxGroup,
  RadioGroup,
  RatingInput,
  SearchBar,
  QuickAdd,
  PinInput,
  PhoneInput,
  DatePicker,
  TimePicker,
  DateRangePicker,
  LocationInput,
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
              {
                id: 'email',
                type: 'email',
                label: 'Email',
                placeholder: 'you@example.com',
                required: true,
              },
              {
                id: 'subject',
                type: 'select',
                label: 'Subject',
                required: true,
                options: [
                  { label: 'General Inquiry', value: 'general' },
                  { label: 'Bug Report', value: 'bug' },
                  { label: 'Feature Request', value: 'feature' },
                ],
              },
              {
                id: 'message',
                type: 'text',
                label: 'Message',
                placeholder: 'Describe your question...',
                required: true,
              },
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
              {
                id: 'username',
                type: 'text',
                label: 'Username',
                placeholder: 'your_handle',
                required: true,
              },
              {
                id: 'email',
                type: 'email',
                label: 'Email',
                placeholder: 'you@example.com',
                required: true,
              },
              {
                id: 'password',
                type: 'password',
                label: 'Password',
                placeholder: 'Min 8 characters',
                required: true,
              },
              {
                id: 'role',
                type: 'select',
                label: 'Role',
                options: [
                  { label: 'Developer', value: 'dev' },
                  { label: 'Designer', value: 'design' },
                  { label: 'Manager', value: 'mgr' },
                ],
              },
              {
                id: 'terms',
                type: 'checkbox',
                label: 'I agree to the Terms of Service',
                required: true,
              },
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
        <Row config={{ gap: 12, alignItems: 'center' }}>
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
          <Row config={{ gap: 16, alignItems: 'center' }}>
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
                  {
                    id: 'first-name',
                    type: 'text',
                    label: 'First Name',
                    placeholder: 'Jane',
                    required: true,
                  },
                  {
                    id: 'last-name',
                    type: 'text',
                    label: 'Last Name',
                    placeholder: 'Doe',
                    required: true,
                  },
                  {
                    id: 'email',
                    type: 'email',
                    label: 'Email',
                    placeholder: 'jane@example.com',
                    required: true,
                  },
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
                  {
                    id: 'bio',
                    type: 'textarea',
                    label: 'Bio',
                    placeholder: 'A few words about you...',
                    helperText: 'Optional but recommended',
                  },
                  {
                    id: 'newsletter',
                    type: 'checkbox',
                    label: 'Subscribe to product updates',
                    defaultValue: true,
                  },
                ],
              },
              {
                id: 'review',
                title: 'Review',
                description: 'Confirm your details before submitting',
                fields: [
                  {
                    id: 'terms',
                    type: 'checkbox',
                    label: 'I agree to the Terms of Service',
                    required: true,
                  },
                  {
                    id: 'privacy',
                    type: 'checkbox',
                    label: 'I accept the Privacy Policy',
                    required: true,
                  },
                ],
              },
            ],
            onComplete: { type: 'toast', message: 'Profile created successfully!' },
            onCancel: { type: 'toast', message: 'Wizard cancelled' },
          }}
        />
        <SectionLabel label="PasswordInput — secure text entry with visibility toggle" />
        <Stack config={{ gap: 12 }}>
          <PasswordInput
            config={{
              id: 'password-basic',
              label: 'Password',
              placeholder: 'Enter your password',
            }}
          />
          <PasswordInput
            config={{
              id: 'password-confirm',
              label: 'Confirm Password',
              placeholder: 'Re-enter your password',
              showToggle: true,
              maxLength: 64,
              onSubmitAction: { type: 'toast', message: 'Password submitted' },
            }}
          />
          <PasswordInput
            config={{
              id: 'password-error',
              label: 'New Password',
              placeholder: 'Min 8 characters',
              errorText: 'Password must be at least 8 characters',
            }}
          />
        </Stack>

        <SectionLabel label="CheckboxGroup — multiple selection from options" />
        <Stack config={{ gap: 12 }}>
          <CheckboxGroup
            config={{
              id: 'interests',
              label: 'Interests',
              options: [
                { value: 'music', label: 'Music' },
                { value: 'sports', label: 'Sports' },
                { value: 'travel', label: 'Travel' },
                { value: 'cooking', label: 'Cooking' },
                { value: 'gaming', label: 'Gaming' },
              ],
              defaultValue: ['music', 'travel'],
              onChangeAction: { type: 'toast', message: 'Interests updated' },
            }}
          />
          <CheckboxGroup
            config={{
              id: 'permissions',
              label: 'Permissions',
              orientation: 'horizontal',
              options: [
                { value: 'read', label: 'Read' },
                { value: 'write', label: 'Write' },
                { value: 'admin', label: 'Admin', disabled: true },
              ],
              defaultValue: ['read'],
              onChangeAction: { type: 'toast', message: 'Permissions changed' },
            }}
          />
        </Stack>

        <SectionLabel label="RadioGroup — single selection from options" />
        <Stack config={{ gap: 12 }}>
          <RadioGroup
            config={{
              id: 'shipping',
              label: 'Shipping Method',
              options: [
                { value: 'standard', label: 'Standard (5-7 days)' },
                { value: 'express', label: 'Express (2-3 days)' },
                { value: 'overnight', label: 'Overnight' },
              ],
              defaultValue: 'standard',
              onChangeAction: { type: 'toast', message: 'Shipping method selected' },
            }}
          />
          <RadioGroup
            config={{
              id: 'priority',
              label: 'Priority',
              orientation: 'horizontal',
              options: [
                { value: 'low', label: 'Low' },
                { value: 'medium', label: 'Medium' },
                { value: 'high', label: 'High' },
                { value: 'critical', label: 'Critical', disabled: true },
              ],
              defaultValue: 'medium',
              onChangeAction: { type: 'toast', message: 'Priority set' },
            }}
          />
        </Stack>

        <SectionLabel label="RatingInput — star rating selector" />
        <Stack config={{ gap: 12 }}>
          <RatingInput
            config={{
              id: 'product-rating',
              label: 'Rate this product',
              maxStars: 5,
              defaultValue: 4,
              onChangeAction: { type: 'toast', message: 'Rating submitted' },
            }}
          />
          <RatingInput
            config={{
              id: 'precision-rating',
              label: 'How was your experience?',
              maxStars: 5,
              allowHalf: true,
              defaultValue: 3.5,
              size: 'lg',
              onChangeAction: { type: 'toast', message: 'Experience rated' },
            }}
          />
          <RatingInput
            config={{
              id: 'readonly-rating',
              label: 'Average Rating',
              maxStars: 5,
              defaultValue: 4,
              readOnly: true,
              size: 'sm',
            }}
          />
        </Stack>

        <SectionLabel label="SearchBar — instant search with debounce" />
        <Stack config={{ gap: 12 }}>
          <SearchBar
            config={{
              id: 'search-default',
              placeholder: 'Search products...',
              onChangeAction: { type: 'toast', message: 'Searching...' },
              onSubmitAction: { type: 'toast', message: 'Search submitted' },
            }}
          />
          <SearchBar
            config={{
              id: 'search-cancel',
              placeholder: 'Search users...',
              showCancelButton: true,
              debounceMs: 500,
              onChangeAction: { type: 'toast', message: 'Filtering users...' },
            }}
          />
        </Stack>

        <SectionLabel label="QuickAdd — inline item creation" />
        <QuickAdd
          config={{
            id: 'quick-add-task',
            placeholder: 'Add a new task...',
            submitLabel: 'Add',
            icon: 'plus',
            onSubmit: { type: 'toast', message: 'Task added' },
          }}
        />

        <SectionLabel label="PinInput — numeric code entry" />
        <Stack config={{ gap: 12 }}>
          <PinInput
            config={{
              id: 'verification-code',
              label: 'Verification Code',
              length: 6,
              onComplete: { type: 'toast', message: 'Code verified' },
            }}
          />
          <PinInput
            config={{
              id: 'secure-pin',
              label: 'Enter PIN',
              length: 4,
              secureEntry: true,
              onComplete: { type: 'toast', message: 'PIN accepted' },
            }}
          />
        </Stack>

        <SectionLabel label="PhoneInput — international phone number entry" />
        <Stack config={{ gap: 12 }}>
          <PhoneInput
            config={{
              id: 'phone-us',
              label: 'Phone Number',
              defaultCountry: 'US',
              onChangeAction: { type: 'toast', message: 'Phone number updated' },
            }}
          />
          <PhoneInput
            config={{
              id: 'phone-error',
              label: 'Emergency Contact',
              defaultCountry: 'GB',
              helperText: 'Include area code',
              errorText: 'Please enter a valid phone number',
            }}
          />
        </Stack>

        <SectionLabel label="DatePicker — calendar date selection" />
        <Stack config={{ gap: 12 }}>
          <DatePicker
            config={{
              id: 'birth-date',
              label: 'Date of Birth',
              placeholder: 'Select your birthday',
              maxDate: '2008-12-31',
              format: 'MM/DD/YYYY',
              onChangeAction: { type: 'toast', message: 'Date selected' },
            }}
          />
          <DatePicker
            config={{
              id: 'appointment-date',
              label: 'Appointment Date',
              placeholder: 'Pick a date',
              minDate: '2026-04-09',
              maxDate: '2026-12-31',
              defaultValue: '2026-04-15',
              onChangeAction: { type: 'toast', message: 'Appointment date set' },
            }}
          />
        </Stack>

        <SectionLabel label="TimePicker — time selection" />
        <Stack config={{ gap: 12 }}>
          <TimePicker
            config={{
              id: 'meeting-time',
              label: 'Meeting Time',
              placeholder: 'Select a time',
              minuteInterval: 15,
              defaultValue: '09:00',
              onChangeAction: { type: 'toast', message: 'Meeting time set' },
            }}
          />
          <TimePicker
            config={{
              id: 'alarm-time',
              label: 'Alarm',
              is24Hour: true,
              minuteInterval: 5,
              defaultValue: '07:30',
              onChangeAction: { type: 'toast', message: 'Alarm set' },
            }}
          />
        </Stack>

        <SectionLabel label="DateRangePicker — start and end date selection" />
        <DateRangePicker
          config={{
            id: 'vacation-range',
            label: 'Vacation Dates',
            startPlaceholder: 'Check-in',
            endPlaceholder: 'Check-out',
            minDate: '2026-04-09',
            defaultStart: '2026-06-01',
            defaultEnd: '2026-06-14',
            onChangeAction: { type: 'toast', message: 'Date range updated' },
          }}
        />

        <SectionLabel label="LocationInput — address and coordinates entry" />
        <Stack config={{ gap: 12 }}>
          <LocationInput
            config={{
              id: 'delivery-address',
              label: 'Delivery Address',
              placeholder: 'Enter delivery address',
              showPreview: true,
              onChangeAction: { type: 'toast', message: 'Location updated' },
            }}
          />
          <LocationInput
            config={{
              id: 'office-location',
              label: 'Office Location',
              placeholder: 'Search for your office',
              defaultValue: {
                latitude: 40.7128,
                longitude: -74.006,
                address: '350 Fifth Avenue, New York, NY 10118',
              },
              showPreview: true,
              onChangeAction: { type: 'toast', message: 'Office location set' },
            }}
          />
        </Stack>
      </MockProviders>
    </ShowcaseScreen>
  )
}
