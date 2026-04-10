/**
 * Default component registry — maps config `type` strings to React components.
 * Pass this to ManifestApp or ScreenRenderer as `componentRegistry`.
 *
 * @example
 * <ManifestApp
 *   componentRegistry={defaultComponentRegistry}
 *   // ...
 * />
 */

// ── Layout ────────────────────────────────────────────────────────────────────
import { Stack } from './layout/stack'
import { Row } from './layout/row'
import { Card } from './layout/card'
import { Divider } from './layout/divider'
import { Spacer } from './layout/spacer'
import { Section } from './layout/section'
import { ScrollContainer } from './layout/scroll-container'

// ── Data ──────────────────────────────────────────────────────────────────────
import { DataList } from './data/data-list'
import { StatCard } from './data/stat-card'
import { Badge } from './data/badge'
import { Avatar } from './data/avatar'
import { AvatarGroup } from './data/avatar-group'
import { EmptyState } from './data/empty-state'
import { LoadingState } from './data/loading-state'
import { Alert } from './data/alert'
import { Tooltip } from './data/tooltip'
import { SaveIndicator } from './data/save-indicator'
import { HighlightedText } from './data/highlighted-text'
import { DataTable } from './data/data-table'
import { DetailCard } from './data/detail-card'
import { FilterBar } from './data/filter-bar'
import { FavoriteButton } from './data/favorite-button'
import { NotificationBell } from './data/notification-bell'
import { Chart } from './data/chart'
import { EntityPicker } from './data/entity-picker'
import { FilterSheet } from './data/filter-sheet'
import { SortPicker } from './data/sort-picker'
import { Pagination } from './data/pagination'
import { PullToRefresh } from './data/pull-to-refresh'
import { ProgressCircle } from './data/progress-circle'
import { Skeleton } from './data/skeleton'

// ── Forms ─────────────────────────────────────────────────────────────────────
import { TextInput } from './forms/text-input'
import { Select } from './forms/select'
import { Checkbox } from './forms/checkbox'
import { Switch } from './forms/switch'
import { Slider } from './forms/slider'
import { FormField } from './forms/form-field'
import { AutoForm } from './forms/auto-form'
import { Button } from './forms/button'
import { Textarea } from './forms/textarea'
import { Toggle } from './forms/toggle'
import { MultiSelect } from './forms/multi-select'
import { TagSelector } from './forms/tag-selector'
import { InlineEdit } from './forms/inline-edit'
import { Wizard } from './forms/wizard'
import { PasswordInput } from './forms/password-input'
import { CheckboxGroup } from './forms/checkbox-group'
import { RadioGroup } from './forms/radio-group'
import { RatingInput } from './forms/rating-input'
import { SearchBar } from './forms/search-bar'
import { QuickAdd } from './forms/quick-add'
import { PinInput } from './forms/pin-input'
import { PhoneInput } from './forms/phone-input'
import { DatePicker } from './forms/date-picker'
import { TimePicker } from './forms/time-picker'
import { DateRangePicker } from './forms/date-range-picker'
import { LocationInput } from './forms/location-input'

// ── Overlay ───────────────────────────────────────────────────────────────────
import { BottomSheet } from './overlay/bottom-sheet'
import { Modal } from './overlay/modal'
import { Toast } from './overlay/toast'
import { ActionSheet } from './overlay/action-sheet'
import { Drawer } from './overlay/drawer'
import { Popover } from './overlay/popover'
import { DropdownMenu } from './overlay/dropdown-menu'
import { ContextMenu } from './overlay/context-menu'
import { ConfirmDialog } from './overlay/confirm-dialog'
import { CommandPalette } from './overlay/command-palette'

// ── Navigation ────────────────────────────────────────────────────────────────
import { Tabs } from './navigation/tabs'
import { SegmentedControl } from './navigation/segmented-control'
import { Header } from './navigation/header'
import { BackButton } from './navigation/back-button'
import { Accordion } from './navigation/accordion'
import { TreeView } from './navigation/tree-view'
import { TopBar } from './navigation/top-bar'
import { BottomTabBar } from './navigation/bottom-tab-bar'
import { DrawerMenu } from './navigation/drawer-menu'

// ── Layout (screen wrappers) ─────────────────────────────────────────────────
import { Screen } from './layout/screen'
import { KeyboardAvoidingScreen } from './layout/keyboard-avoiding-screen'

// ── Content ───────────────────────────────────────────────────────────────────
import { Heading } from './content/heading'
import { Body } from './content/body'
import { Label } from './content/label'
import { Link } from './content/link'
import { Image } from './content/image'
import { Markdown } from './content/markdown'
import { CodeBlock } from './content/code-block'
import { RichInput } from './content/rich-input'
import { FileUploader } from './content/file-uploader'
import { LinkEmbed } from './content/link-embed'
import { RichTextViewer } from './content/rich-text-viewer'
import { RichTextEditor } from './content/rich-text-editor'
import { ImageViewer } from './content/image-viewer'
import { MediaPicker } from './content/media-picker'
import { VideoPlayer } from './content/video-player'
import { AudioPlayer } from './content/audio-player'
import { QrCode } from './content/qr-code'
import { QrScanner } from './content/qr-scanner'
import { CompareView } from './content/compare-view'

// ── Communication ─────────────────────────────────────────────────────────────
import { ChatBubble } from './communication/chat-bubble'
import { NotificationItem } from './communication/notification-item'
import { ActivityFeed } from './communication/activity-feed'
import { Feed } from './communication/feed'
import { ReactionBar } from './communication/reaction-bar'
import { PresenceIndicator } from './communication/presence-indicator'
import { TypingIndicator } from './communication/typing-indicator'
import { MessageThread } from './communication/message-thread'
import { ChatWindow } from './communication/chat-window'
import { CommentSection } from './communication/comment-section'
import { EmojiPicker } from './communication/emoji-picker'
import { GifPicker } from './communication/gif-picker'
import { ReactionPicker } from './communication/reaction-picker'

// ── Auth ──────────────────────────────────────────────────────────────────────
import { LoginForm } from './auth/login-form'
import { RegisterForm } from './auth/register-form'
import { ForgotPasswordForm } from './auth/forgot-password-form'

// ── Workflow ──────────────────────────────────────────────────────────────────
import { ProgressBar } from './workflow/progress-bar'
import { Stepper } from './workflow/stepper'
import { Timeline } from './workflow/timeline'
import { StatusBadge } from './workflow/status-badge'
import { Calendar } from './workflow/calendar'
import { AuditLog } from './workflow/audit-log'
import { NotificationFeed } from './workflow/notification-feed'
import { KanbanBoard } from './workflow/kanban-board'

// ── Commerce ──────────────────────────────────────────────────────────────────
import { PriceDisplay } from './commerce/price-display'
import { ProductCard } from './commerce/product-card'
import { CartItem } from './commerce/cart-item'
import { PricingTable } from './commerce/pricing-table'

import type { ComponentConfig } from '../manifest/types'
import type React from 'react'

export const defaultComponentRegistry: Record<string, React.ComponentType<ComponentConfig>> = {
  // Layout
  Stack: Stack as unknown as React.ComponentType<ComponentConfig>,
  Row: Row as unknown as React.ComponentType<ComponentConfig>,
  Card: Card as unknown as React.ComponentType<ComponentConfig>,
  Divider: Divider as unknown as React.ComponentType<ComponentConfig>,
  Spacer: Spacer as unknown as React.ComponentType<ComponentConfig>,
  Section: Section as unknown as React.ComponentType<ComponentConfig>,
  ScrollContainer: ScrollContainer as unknown as React.ComponentType<ComponentConfig>,

  // Data
  DataList: DataList as unknown as React.ComponentType<ComponentConfig>,
  StatCard: StatCard as unknown as React.ComponentType<ComponentConfig>,
  Badge: Badge as unknown as React.ComponentType<ComponentConfig>,
  Avatar: Avatar as unknown as React.ComponentType<ComponentConfig>,
  AvatarGroup: AvatarGroup as unknown as React.ComponentType<ComponentConfig>,
  EmptyState: EmptyState as unknown as React.ComponentType<ComponentConfig>,
  LoadingState: LoadingState as unknown as React.ComponentType<ComponentConfig>,
  Alert: Alert as unknown as React.ComponentType<ComponentConfig>,
  Tooltip: Tooltip as unknown as React.ComponentType<ComponentConfig>,
  SaveIndicator: SaveIndicator as unknown as React.ComponentType<ComponentConfig>,
  HighlightedText: HighlightedText as unknown as React.ComponentType<ComponentConfig>,
  DataTable: DataTable as unknown as React.ComponentType<ComponentConfig>,
  DetailCard: DetailCard as unknown as React.ComponentType<ComponentConfig>,
  FilterBar: FilterBar as unknown as React.ComponentType<ComponentConfig>,
  FavoriteButton: FavoriteButton as unknown as React.ComponentType<ComponentConfig>,
  NotificationBell: NotificationBell as unknown as React.ComponentType<ComponentConfig>,
  Chart: Chart as unknown as React.ComponentType<ComponentConfig>,
  EntityPicker: EntityPicker as unknown as React.ComponentType<ComponentConfig>,
  FilterSheet: FilterSheet as unknown as React.ComponentType<ComponentConfig>,
  SortPicker: SortPicker as unknown as React.ComponentType<ComponentConfig>,
  Pagination: Pagination as unknown as React.ComponentType<ComponentConfig>,
  PullToRefresh: PullToRefresh as unknown as React.ComponentType<ComponentConfig>,
  ProgressCircle: ProgressCircle as unknown as React.ComponentType<ComponentConfig>,
  Skeleton: Skeleton as unknown as React.ComponentType<ComponentConfig>,

  // Forms
  TextInput: TextInput as unknown as React.ComponentType<ComponentConfig>,
  Select: Select as unknown as React.ComponentType<ComponentConfig>,
  Checkbox: Checkbox as unknown as React.ComponentType<ComponentConfig>,
  Switch: Switch as unknown as React.ComponentType<ComponentConfig>,
  Slider: Slider as unknown as React.ComponentType<ComponentConfig>,
  FormField: FormField as unknown as React.ComponentType<ComponentConfig>,
  AutoForm: AutoForm as unknown as React.ComponentType<ComponentConfig>,
  Button: Button as unknown as React.ComponentType<ComponentConfig>,
  Textarea: Textarea as unknown as React.ComponentType<ComponentConfig>,
  Toggle: Toggle as unknown as React.ComponentType<ComponentConfig>,
  MultiSelect: MultiSelect as unknown as React.ComponentType<ComponentConfig>,
  TagSelector: TagSelector as unknown as React.ComponentType<ComponentConfig>,
  InlineEdit: InlineEdit as unknown as React.ComponentType<ComponentConfig>,
  Wizard: Wizard as unknown as React.ComponentType<ComponentConfig>,
  PasswordInput: PasswordInput as unknown as React.ComponentType<ComponentConfig>,
  CheckboxGroup: CheckboxGroup as unknown as React.ComponentType<ComponentConfig>,
  RadioGroup: RadioGroup as unknown as React.ComponentType<ComponentConfig>,
  RatingInput: RatingInput as unknown as React.ComponentType<ComponentConfig>,
  SearchBar: SearchBar as unknown as React.ComponentType<ComponentConfig>,
  QuickAdd: QuickAdd as unknown as React.ComponentType<ComponentConfig>,
  PinInput: PinInput as unknown as React.ComponentType<ComponentConfig>,
  PhoneInput: PhoneInput as unknown as React.ComponentType<ComponentConfig>,
  DatePicker: DatePicker as unknown as React.ComponentType<ComponentConfig>,
  TimePicker: TimePicker as unknown as React.ComponentType<ComponentConfig>,
  DateRangePicker: DateRangePicker as unknown as React.ComponentType<ComponentConfig>,
  LocationInput: LocationInput as unknown as React.ComponentType<ComponentConfig>,

  // Overlay
  BottomSheet: BottomSheet as unknown as React.ComponentType<ComponentConfig>,
  Modal: Modal as unknown as React.ComponentType<ComponentConfig>,
  Toast: Toast as unknown as React.ComponentType<ComponentConfig>,
  ActionSheet: ActionSheet as unknown as React.ComponentType<ComponentConfig>,
  Drawer: Drawer as unknown as React.ComponentType<ComponentConfig>,
  Popover: Popover as unknown as React.ComponentType<ComponentConfig>,
  DropdownMenu: DropdownMenu as unknown as React.ComponentType<ComponentConfig>,
  ContextMenu: ContextMenu as unknown as React.ComponentType<ComponentConfig>,
  ConfirmDialog: ConfirmDialog as unknown as React.ComponentType<ComponentConfig>,
  CommandPalette: CommandPalette as unknown as React.ComponentType<ComponentConfig>,

  // Navigation
  Tabs: Tabs as unknown as React.ComponentType<ComponentConfig>,
  SegmentedControl: SegmentedControl as unknown as React.ComponentType<ComponentConfig>,
  Header: Header as unknown as React.ComponentType<ComponentConfig>,
  BackButton: BackButton as unknown as React.ComponentType<ComponentConfig>,
  Accordion: Accordion as unknown as React.ComponentType<ComponentConfig>,
  TreeView: TreeView as unknown as React.ComponentType<ComponentConfig>,
  TopBar: TopBar as unknown as React.ComponentType<ComponentConfig>,
  BottomTabBar: BottomTabBar as unknown as React.ComponentType<ComponentConfig>,
  DrawerMenu: DrawerMenu as unknown as React.ComponentType<ComponentConfig>,
  Screen: Screen as unknown as React.ComponentType<ComponentConfig>,
  KeyboardAvoidingScreen: KeyboardAvoidingScreen as unknown as React.ComponentType<ComponentConfig>,

  // Content
  Heading: Heading as unknown as React.ComponentType<ComponentConfig>,
  Body: Body as unknown as React.ComponentType<ComponentConfig>,
  Label: Label as unknown as React.ComponentType<ComponentConfig>,
  Link: Link as unknown as React.ComponentType<ComponentConfig>,
  Image: Image as unknown as React.ComponentType<ComponentConfig>,
  Markdown: Markdown as unknown as React.ComponentType<ComponentConfig>,
  CodeBlock: CodeBlock as unknown as React.ComponentType<ComponentConfig>,
  RichInput: RichInput as unknown as React.ComponentType<ComponentConfig>,
  FileUploader: FileUploader as unknown as React.ComponentType<ComponentConfig>,
  LinkEmbed: LinkEmbed as unknown as React.ComponentType<ComponentConfig>,
  RichTextViewer: RichTextViewer as unknown as React.ComponentType<ComponentConfig>,
  RichTextEditor: RichTextEditor as unknown as React.ComponentType<ComponentConfig>,
  ImageViewer: ImageViewer as unknown as React.ComponentType<ComponentConfig>,
  MediaPicker: MediaPicker as unknown as React.ComponentType<ComponentConfig>,
  VideoPlayer: VideoPlayer as unknown as React.ComponentType<ComponentConfig>,
  AudioPlayer: AudioPlayer as unknown as React.ComponentType<ComponentConfig>,
  QrCode: QrCode as unknown as React.ComponentType<ComponentConfig>,
  QrScanner: QrScanner as unknown as React.ComponentType<ComponentConfig>,
  CompareView: CompareView as unknown as React.ComponentType<ComponentConfig>,

  // Communication
  ChatBubble: ChatBubble as unknown as React.ComponentType<ComponentConfig>,
  NotificationItem: NotificationItem as unknown as React.ComponentType<ComponentConfig>,
  ActivityFeed: ActivityFeed as unknown as React.ComponentType<ComponentConfig>,
  Feed: Feed as unknown as React.ComponentType<ComponentConfig>,
  ReactionBar: ReactionBar as unknown as React.ComponentType<ComponentConfig>,
  PresenceIndicator: PresenceIndicator as unknown as React.ComponentType<ComponentConfig>,
  TypingIndicator: TypingIndicator as unknown as React.ComponentType<ComponentConfig>,
  MessageThread: MessageThread as unknown as React.ComponentType<ComponentConfig>,
  ChatWindow: ChatWindow as unknown as React.ComponentType<ComponentConfig>,
  CommentSection: CommentSection as unknown as React.ComponentType<ComponentConfig>,
  EmojiPicker: EmojiPicker as unknown as React.ComponentType<ComponentConfig>,
  GifPicker: GifPicker as unknown as React.ComponentType<ComponentConfig>,
  ReactionPicker: ReactionPicker as unknown as React.ComponentType<ComponentConfig>,

  // Auth
  LoginForm: LoginForm as unknown as React.ComponentType<ComponentConfig>,
  RegisterForm: RegisterForm as unknown as React.ComponentType<ComponentConfig>,
  ForgotPasswordForm: ForgotPasswordForm as unknown as React.ComponentType<ComponentConfig>,

  // Workflow
  ProgressBar: ProgressBar as unknown as React.ComponentType<ComponentConfig>,
  Stepper: Stepper as unknown as React.ComponentType<ComponentConfig>,
  Timeline: Timeline as unknown as React.ComponentType<ComponentConfig>,
  StatusBadge: StatusBadge as unknown as React.ComponentType<ComponentConfig>,
  Calendar: Calendar as unknown as React.ComponentType<ComponentConfig>,
  AuditLog: AuditLog as unknown as React.ComponentType<ComponentConfig>,
  NotificationFeed: NotificationFeed as unknown as React.ComponentType<ComponentConfig>,
  KanbanBoard: KanbanBoard as unknown as React.ComponentType<ComponentConfig>,

  // Commerce
  PriceDisplay: PriceDisplay as unknown as React.ComponentType<ComponentConfig>,
  ProductCard: ProductCard as unknown as React.ComponentType<ComponentConfig>,
  CartItem: CartItem as unknown as React.ComponentType<ComponentConfig>,
  PricingTable: PricingTable as unknown as React.ComponentType<ComponentConfig>,
}
