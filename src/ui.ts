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
