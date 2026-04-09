// ── Tokens ────────────────────────────────────────────────────────────────────
export {
  resolveTokens,
  flavors,
  flavorNames,
  lighten,
  darken,
  alpha,
  mix,
  defaultSpacing,
  defaultRadius,
  defaultTypography,
  defaultShadows,
} from './ui/tokens/index'

export type {
  HexColor,
  ColorTokens,
  SpacingTokens,
  RadiusTokens,
  TypographyTokens,
  ShadowToken,
  ShadowTokens,
  DesignTokens,
  TokenFlavor,
  TokenConfig,
  DeepPartial,
  FlavorName,
} from './ui/tokens/index'

export { useTokenEditor, useTokenOverrides } from './ui/tokens/editor'

// ── Context ────────────────────────────────────────────────────────────────────
export { ScreenContextProvider, useScreenContext, useScreenValue } from './ui/context/index'
export type { ScreenContextValue } from './ui/context/index'
export { AppContextProvider, useAppContext, useTokens } from './ui/context/index'
export type { AppContextValue } from './ui/context/index'

// ── Actions ───────────────────────────────────────────────────────────────────
export { executeAction } from './ui/actions/executor'
export type { ActionExecutorDeps } from './ui/actions/executor'
export type {
  Action,
  ActionType,
  ImpactStyle,
  NotificationType,
  NavigateAction,
  ApiAction,
  OpenBottomSheetAction,
  CloseBottomSheetAction,
  OpenModalAction,
  CloseModalAction,
  ActionSheetAction,
  RefreshAction,
  SetValueAction,
  ToastAction,
  HapticAction,
  ShareAction,
  ClipboardAction,
  ConfirmAction,
  OpenUrlAction,
  RunWorkflowAction,
  CameraAction,
  MediaPickerAction,
  ScanQrAction,
} from './ui/actions/types'

// ── Component base ────────────────────────────────────────────────────────────
export { ComponentWrapper, useComponentData, resolveFromRef, isFromRef } from './ui/components/_base/index'
export type { ComponentWrapperProps } from './ui/components/_base/index'

// ── Manifest ──────────────────────────────────────────────────────────────────
export { ScreenRenderer, ManifestApp } from './ui/manifest/index'
export type { ScreenConfig, ComponentConfig, ManifestConfig } from './ui/manifest/index'

// ── Component registry ────────────────────────────────────────────────────────
export { defaultComponentRegistry } from './ui/components/registry'

// ── Layout components ─────────────────────────────────────────────────────────
export { Stack } from './ui/components/layout/stack'
export { Row } from './ui/components/layout/row'
export { Card } from './ui/components/layout/card'
export { Divider } from './ui/components/layout/divider'
export { Spacer } from './ui/components/layout/spacer'
export { Section } from './ui/components/layout/section'
export { ScrollContainer } from './ui/components/layout/scroll-container'

// ── Data components ───────────────────────────────────────────────────────────
export { DataList } from './ui/components/data/data-list'
export { StatCard } from './ui/components/data/stat-card'
export { Badge } from './ui/components/data/badge'
export { Avatar } from './ui/components/data/avatar'
export { AvatarGroup } from './ui/components/data/avatar-group'
export { EmptyState } from './ui/components/data/empty-state'
export { LoadingState } from './ui/components/data/loading-state'

// ── Form components ───────────────────────────────────────────────────────────
export { TextInput } from './ui/components/forms/text-input'
export { Select } from './ui/components/forms/select'
export { Checkbox } from './ui/components/forms/checkbox'
export { Switch } from './ui/components/forms/switch'
export { Slider } from './ui/components/forms/slider'
export { FormField } from './ui/components/forms/form-field'
export { AutoForm } from './ui/components/forms/auto-form'

// ── Overlay components ────────────────────────────────────────────────────────
export { BottomSheet } from './ui/components/overlay/bottom-sheet'
export { Modal } from './ui/components/overlay/modal'
export { Toast } from './ui/components/overlay/toast'
export { ActionSheet } from './ui/components/overlay/action-sheet'

// ── Navigation components ─────────────────────────────────────────────────────
export { Tabs } from './ui/components/navigation/tabs'
export { SegmentedControl } from './ui/components/navigation/segmented-control'
export { Header } from './ui/components/navigation/header'
export { BackButton } from './ui/components/navigation/back-button'

// ── Content components ────────────────────────────────────────────────────────
export { Heading } from './ui/components/content/heading'
export { Body } from './ui/components/content/body'
export { Label } from './ui/components/content/label'
export { Link } from './ui/components/content/link'
export { Image } from './ui/components/content/image'

// ── Communication components ──────────────────────────────────────────────────
export { ChatBubble } from './ui/components/communication/chat-bubble'
export { NotificationItem } from './ui/components/communication/notification-item'
export { ActivityFeed } from './ui/components/communication/activity-feed'

// ── Auth components ───────────────────────────────────────────────────────────
export { LoginForm } from './ui/components/auth/login-form'
export { RegisterForm } from './ui/components/auth/register-form'
export { ForgotPasswordForm } from './ui/components/auth/forgot-password-form'

// ── Workflow components ───────────────────────────────────────────────────────
export { ProgressBar } from './ui/components/workflow/progress-bar'
export { Stepper } from './ui/components/workflow/stepper'
export { Timeline } from './ui/components/workflow/timeline'
export { StatusBadge } from './ui/components/workflow/status-badge'

// ── Commerce components ───────────────────────────────────────────────────────
export { PriceDisplay } from './ui/components/commerce/price-display'
export { ProductCard } from './ui/components/commerce/product-card'
export { CartItem } from './ui/components/commerce/cart-item'
