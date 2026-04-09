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

// ── Forms ─────────────────────────────────────────────────────────────────────
import { TextInput } from './forms/text-input'
import { Select } from './forms/select'
import { Checkbox } from './forms/checkbox'
import { Switch } from './forms/switch'
import { Slider } from './forms/slider'
import { FormField } from './forms/form-field'
import { AutoForm } from './forms/auto-form'

// ── Overlay ───────────────────────────────────────────────────────────────────
import { BottomSheet } from './overlay/bottom-sheet'
import { Modal } from './overlay/modal'
import { Toast } from './overlay/toast'
import { ActionSheet } from './overlay/action-sheet'

// ── Navigation ────────────────────────────────────────────────────────────────
import { Tabs } from './navigation/tabs'
import { SegmentedControl } from './navigation/segmented-control'
import { Header } from './navigation/header'
import { BackButton } from './navigation/back-button'

// ── Content ───────────────────────────────────────────────────────────────────
import { Heading } from './content/heading'
import { Body } from './content/body'
import { Label } from './content/label'
import { Link } from './content/link'
import { Image } from './content/image'

// ── Communication ─────────────────────────────────────────────────────────────
import { ChatBubble } from './communication/chat-bubble'
import { NotificationItem } from './communication/notification-item'
import { ActivityFeed } from './communication/activity-feed'

// ── Auth ──────────────────────────────────────────────────────────────────────
import { LoginForm } from './auth/login-form'
import { RegisterForm } from './auth/register-form'
import { ForgotPasswordForm } from './auth/forgot-password-form'

// ── Workflow ──────────────────────────────────────────────────────────────────
import { ProgressBar } from './workflow/progress-bar'
import { Stepper } from './workflow/stepper'
import { Timeline } from './workflow/timeline'
import { StatusBadge } from './workflow/status-badge'

// ── Commerce ──────────────────────────────────────────────────────────────────
import { PriceDisplay } from './commerce/price-display'
import { ProductCard } from './commerce/product-card'
import { CartItem } from './commerce/cart-item'

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

  // Forms
  TextInput: TextInput as unknown as React.ComponentType<ComponentConfig>,
  Select: Select as unknown as React.ComponentType<ComponentConfig>,
  Checkbox: Checkbox as unknown as React.ComponentType<ComponentConfig>,
  Switch: Switch as unknown as React.ComponentType<ComponentConfig>,
  Slider: Slider as unknown as React.ComponentType<ComponentConfig>,
  FormField: FormField as unknown as React.ComponentType<ComponentConfig>,
  AutoForm: AutoForm as unknown as React.ComponentType<ComponentConfig>,

  // Overlay
  BottomSheet: BottomSheet as unknown as React.ComponentType<ComponentConfig>,
  Modal: Modal as unknown as React.ComponentType<ComponentConfig>,
  Toast: Toast as unknown as React.ComponentType<ComponentConfig>,
  ActionSheet: ActionSheet as unknown as React.ComponentType<ComponentConfig>,

  // Navigation
  Tabs: Tabs as unknown as React.ComponentType<ComponentConfig>,
  SegmentedControl: SegmentedControl as unknown as React.ComponentType<ComponentConfig>,
  Header: Header as unknown as React.ComponentType<ComponentConfig>,
  BackButton: BackButton as unknown as React.ComponentType<ComponentConfig>,

  // Content
  Heading: Heading as unknown as React.ComponentType<ComponentConfig>,
  Body: Body as unknown as React.ComponentType<ComponentConfig>,
  Label: Label as unknown as React.ComponentType<ComponentConfig>,
  Link: Link as unknown as React.ComponentType<ComponentConfig>,
  Image: Image as unknown as React.ComponentType<ComponentConfig>,

  // Communication
  ChatBubble: ChatBubble as unknown as React.ComponentType<ComponentConfig>,
  NotificationItem: NotificationItem as unknown as React.ComponentType<ComponentConfig>,
  ActivityFeed: ActivityFeed as unknown as React.ComponentType<ComponentConfig>,

  // Auth
  LoginForm: LoginForm as unknown as React.ComponentType<ComponentConfig>,
  RegisterForm: RegisterForm as unknown as React.ComponentType<ComponentConfig>,
  ForgotPasswordForm: ForgotPasswordForm as unknown as React.ComponentType<ComponentConfig>,

  // Workflow
  ProgressBar: ProgressBar as unknown as React.ComponentType<ComponentConfig>,
  Stepper: Stepper as unknown as React.ComponentType<ComponentConfig>,
  Timeline: Timeline as unknown as React.ComponentType<ComponentConfig>,
  StatusBadge: StatusBadge as unknown as React.ComponentType<ComponentConfig>,

  // Commerce
  PriceDisplay: PriceDisplay as unknown as React.ComponentType<ComponentConfig>,
  ProductCard: ProductCard as unknown as React.ComponentType<ComponentConfig>,
  CartItem: CartItem as unknown as React.ComponentType<ComponentConfig>,
}
