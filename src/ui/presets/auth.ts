import type { Action } from '../actions/types'
import type { ComponentConfig, ScreenConfig } from '../manifest/types'
import type { PresetFactory } from './types'

export interface AuthPresetConfig {
  id: string
  /** Which auth form to display. */
  mode: 'login' | 'register' | 'forgot-password'
  /** Screen title. Defaults based on mode. */
  title?: string
  /** Action dispatched on form submission. */
  onSubmit: Action
  /** Action dispatched to switch between login/register/forgot-password. */
  onSwitchMode?: Action
}

const DEFAULT_TITLES: Record<AuthPresetConfig['mode'], string> = {
  login: 'Sign In',
  register: 'Create Account',
  'forgot-password': 'Reset Password',
}

const FORM_COMPONENTS: Record<AuthPresetConfig['mode'], string> = {
  login: 'LoginForm',
  register: 'RegisterForm',
  'forgot-password': 'ForgotPasswordForm',
}

/** Creates an auth screen: Header + LoginForm / RegisterForm / ForgotPasswordForm. */
export const authPreset: PresetFactory<AuthPresetConfig> = (config) => {
  const title = config.title ?? DEFAULT_TITLES[config.mode]

  const components: ComponentConfig[] = [
    {
      type: 'Header',
      id: `${config.id}-header`,
      title,
    },
  ]

  const form: ComponentConfig = {
    type: FORM_COMPONENTS[config.mode],
    id: `${config.id}-form`,
    onSubmit: config.onSubmit,
  }

  if (config.onSwitchMode) {
    form.onSwitchMode = config.onSwitchMode
  }

  components.push(form)

  const screen: ScreenConfig = {
    id: config.id,
    title,
    components,
  }

  return screen
}
