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
  defaultAnimation,
  defaultOpacity,
  defaultZIndex,
} from './ui/tokens/index'

export type {
  HexColor,
  ColorTokens,
  SpacingTokens,
  RadiusTokens,
  TypographyTokens,
  ShadowToken,
  ShadowTokens,
  AnimationTokens,
  OpacityTokens,
  ZIndexTokens,
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
export {
  ComponentWrapper,
  useComponentData,
  resolveFromRef,
  isFromRef,
} from './ui/components/_base/index'
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
export { Alert } from './ui/components/data/alert'
export { Tooltip } from './ui/components/data/tooltip'
export { SaveIndicator } from './ui/components/data/save-indicator'
export { HighlightedText } from './ui/components/data/highlighted-text'
export { DataTable } from './ui/components/data/data-table'
export { DetailCard } from './ui/components/data/detail-card'
export { FilterBar } from './ui/components/data/filter-bar'
export { FavoriteButton } from './ui/components/data/favorite-button'
export { NotificationBell } from './ui/components/data/notification-bell'
export { Chart } from './ui/components/data/chart'
export { EntityPicker } from './ui/components/data/entity-picker'
export { FilterSheet } from './ui/components/data/filter-sheet'
export { SortPicker } from './ui/components/data/sort-picker'
export { Pagination } from './ui/components/data/pagination'
export { PullToRefresh } from './ui/components/data/pull-to-refresh'
export { ProgressCircle } from './ui/components/data/progress-circle'
export { Skeleton } from './ui/components/data/skeleton'

// ── Form components ───────────────────────────────────────────────────────────
export { TextInput } from './ui/components/forms/text-input'
export { Select } from './ui/components/forms/select'
export { Checkbox } from './ui/components/forms/checkbox'
export { Switch } from './ui/components/forms/switch'
export { Slider } from './ui/components/forms/slider'
export { FormField } from './ui/components/forms/form-field'
export { AutoForm } from './ui/components/forms/auto-form'
export { Button } from './ui/components/forms/button'
export { Textarea } from './ui/components/forms/textarea'
export { Toggle } from './ui/components/forms/toggle'
export { MultiSelect } from './ui/components/forms/multi-select'
export { TagSelector } from './ui/components/forms/tag-selector'
export { InlineEdit } from './ui/components/forms/inline-edit'
export { Wizard } from './ui/components/forms/wizard'
export { PasswordInput } from './ui/components/forms/password-input'
export { CheckboxGroup } from './ui/components/forms/checkbox-group'
export { RadioGroup } from './ui/components/forms/radio-group'
export { RatingInput } from './ui/components/forms/rating-input'
export { SearchBar } from './ui/components/forms/search-bar'
export { QuickAdd } from './ui/components/forms/quick-add'
export { PinInput } from './ui/components/forms/pin-input'
export { PhoneInput } from './ui/components/forms/phone-input'
export { DatePicker } from './ui/components/forms/date-picker'
export { TimePicker } from './ui/components/forms/time-picker'
export { DateRangePicker } from './ui/components/forms/date-range-picker'
export { LocationInput } from './ui/components/forms/location-input'

// ── Overlay components ────────────────────────────────────────────────────────
export { BottomSheet } from './ui/components/overlay/bottom-sheet'
export { Modal } from './ui/components/overlay/modal'
export { Toast } from './ui/components/overlay/toast'
export { ActionSheet } from './ui/components/overlay/action-sheet'
export { Drawer } from './ui/components/overlay/drawer'
export { Popover } from './ui/components/overlay/popover'
export { DropdownMenu } from './ui/components/overlay/dropdown-menu'
export { ContextMenu } from './ui/components/overlay/context-menu'
export { ConfirmDialog } from './ui/components/overlay/confirm-dialog'
export { CommandPalette } from './ui/components/overlay/command-palette'

// ── Navigation components ─────────────────────────────────────────────────────
export { Tabs } from './ui/components/navigation/tabs'
export { SegmentedControl } from './ui/components/navigation/segmented-control'
export { Header } from './ui/components/navigation/header'
export { BackButton } from './ui/components/navigation/back-button'
export { Accordion } from './ui/components/navigation/accordion'
export { TreeView } from './ui/components/navigation/tree-view'
export { TopBar } from './ui/components/navigation/top-bar'
export { BottomTabBar } from './ui/components/navigation/bottom-tab-bar'
export { DrawerMenu } from './ui/components/navigation/drawer-menu'

// ── Layout screen wrappers ───────────────────────────────────────────────────
export { Screen } from './ui/components/layout/screen'
export { KeyboardAvoidingScreen } from './ui/components/layout/keyboard-avoiding-screen'

// ── Content components ────────────────────────────────────────────────────────
export { Heading } from './ui/components/content/heading'
export { Body } from './ui/components/content/body'
export { Label } from './ui/components/content/label'
export { Link } from './ui/components/content/link'
export { Image } from './ui/components/content/image'
export { Markdown } from './ui/components/content/markdown'
export { CodeBlock } from './ui/components/content/code-block'
export { RichInput } from './ui/components/content/rich-input'
export { FileUploader } from './ui/components/content/file-uploader'
export { LinkEmbed } from './ui/components/content/link-embed'
export { RichTextViewer } from './ui/components/content/rich-text-viewer'
export { RichTextEditor } from './ui/components/content/rich-text-editor'
export { ImageViewer } from './ui/components/content/image-viewer'
export { MediaPicker } from './ui/components/content/media-picker'
export { VideoPlayer } from './ui/components/content/video-player'
export { AudioPlayer } from './ui/components/content/audio-player'
export { QrCode } from './ui/components/content/qr-code'
export { QrScanner } from './ui/components/content/qr-scanner'
export { CompareView } from './ui/components/content/compare-view'

// ── Communication components ──────────────────────────────────────────────────
export { ChatBubble } from './ui/components/communication/chat-bubble'
export { NotificationItem } from './ui/components/communication/notification-item'
export { ActivityFeed } from './ui/components/communication/activity-feed'
export { Feed } from './ui/components/communication/feed'
export { ReactionBar } from './ui/components/communication/reaction-bar'
export { PresenceIndicator } from './ui/components/communication/presence-indicator'
export { TypingIndicator } from './ui/components/communication/typing-indicator'
export { MessageThread } from './ui/components/communication/message-thread'
export { ChatWindow } from './ui/components/communication/chat-window'
export { CommentSection } from './ui/components/communication/comment-section'
export { EmojiPicker } from './ui/components/communication/emoji-picker'
export { GifPicker } from './ui/components/communication/gif-picker'
export { ReactionPicker } from './ui/components/communication/reaction-picker'

// ── Auth components ───────────────────────────────────────────────────────────
export { LoginForm } from './ui/components/auth/login-form'
export { RegisterForm } from './ui/components/auth/register-form'
export { ForgotPasswordForm } from './ui/components/auth/forgot-password-form'

// ── Workflow components ───────────────────────────────────────────────────────
export { ProgressBar } from './ui/components/workflow/progress-bar'
export { Stepper } from './ui/components/workflow/stepper'
export { Timeline } from './ui/components/workflow/timeline'
export { StatusBadge } from './ui/components/workflow/status-badge'
export { Calendar } from './ui/components/workflow/calendar'
export { AuditLog } from './ui/components/workflow/audit-log'
export { NotificationFeed } from './ui/components/workflow/notification-feed'
export { KanbanBoard } from './ui/components/workflow/kanban-board'

// ── Commerce components ───────────────────────────────────────────────────────
export { PriceDisplay } from './ui/components/commerce/price-display'
export { ProductCard } from './ui/components/commerce/product-card'
export { CartItem } from './ui/components/commerce/cart-item'
export { PricingTable } from './ui/components/commerce/pricing-table'

// ── Headless hooks ────────────────────────────────────────────────────────────
export { useDataList, useAutoForm } from './ui/hooks/index'
export type { UseDataListReturn, UseAutoFormReturn } from './ui/hooks/index'

// ── Screen presets ───────────────────────────────────────────────────────────
export {
  listPreset,
  detailPreset,
  formPreset,
  settingsPreset,
  dashboardPreset,
  authPreset,
  chatPreset,
  notificationCenterPreset,
  pricingPreset,
} from './ui/presets/index'

export type {
  PresetFactory,
  ListPresetConfig,
  DetailPresetConfig,
  FormPresetConfig,
  SettingsPresetConfig,
  DashboardPresetConfig,
  AuthPresetConfig,
  ChatPresetConfig,
  NotificationCenterPresetConfig,
  PricingPresetConfig,
} from './ui/presets/index'
