import {
  LoginForm,
  RegisterForm,
  ForgotPasswordForm,
  Stack,
  Heading,
  Divider,
} from '@lastshotlabs/pocketshot/ui'
import { ShowcaseScreen, SectionLabel } from '@/lib/ShowcaseScreen'
import { MockProviders } from '@/lib/MockProviders'

export default function AuthComponentsShowcase() {
  return (
    <ShowcaseScreen title="Auth Components">
      <MockProviders>
        <SectionLabel label="LoginForm — email + password" />
        <LoginForm
          config={{
            onSubmit: { type: 'toast', message: 'Login submitted (demo)' },
            submitLabel: 'Sign In',
            forgotPasswordAction: { type: 'toast', message: 'Forgot password tapped' },
            registerAction: { type: 'toast', message: 'Register tapped' },
            showSocialButtons: false,
          }}
        />

        <Divider config={{ marginY: 8 }} />

        <SectionLabel label="LoginForm — with social providers" />
        <LoginForm
          config={{
            onSubmit: { type: 'toast', message: 'Login submitted (demo)' },
            submitLabel: 'Continue',
            showSocialButtons: true,
            socialProviders: ['google', 'apple', 'github'],
            forgotPasswordAction: { type: 'toast', message: 'Forgot password tapped' },
          }}
        />

        <Divider config={{ marginY: 8 }} />

        <SectionLabel label="RegisterForm — default fields" />
        <RegisterForm
          config={{
            onSubmit: { type: 'toast', message: 'Register submitted (demo)' },
            submitLabel: 'Create Account',
            loginAction: { type: 'toast', message: 'Login tapped' },
          }}
        />

        <Divider config={{ marginY: 8 }} />

        <SectionLabel label="RegisterForm — full fields" />
        <RegisterForm
          config={{
            fields: ['email', 'username', 'password', 'confirmPassword'],
            onSubmit: { type: 'toast', message: 'Register submitted (demo)' },
            submitLabel: 'Get Started',
            loginAction: { type: 'toast', message: 'Login tapped' },
          }}
        />

        <Divider config={{ marginY: 8 }} />

        <SectionLabel label="ForgotPasswordForm" />
        <ForgotPasswordForm
          config={{
            onSubmit: { type: 'toast', message: 'Reset email sent (demo)' },
            submitLabel: 'Send Reset Email',
            backAction: { type: 'toast', message: 'Back to login tapped' },
          }}
        />
      </MockProviders>
    </ShowcaseScreen>
  )
}
