import type {
  ActionBase,
  ActionConfig as SharedAction,
  ApiAction,
  BranchAction,
  CloseModalAction,
  ConfirmAction,
  CopyAction,
  CopyToClipboardAction,
  DownloadAction,
  EmitAction,
  ForEachAction,
  LogAction,
  NavigateAction,
  NavigateExternalAction,
  OpenModalAction,
  RefreshAction,
  RunWorkflowAction,
  ScrollToAction,
  SetThemeAction,
  SetValueAction,
  SubmitFormAction,
  ToastAction,
  TrackAction,
  WsSendAction,
} from '@lastshotlabs/frontend-contract/actions'

export type ImpactStyle = 'light' | 'medium' | 'heavy' | 'soft' | 'rigid'
export type NotificationType = 'success' | 'warning' | 'error'

export interface OpenBottomSheetAction extends ActionBase {
  type: 'open-bottom-sheet'
  sheet: string
  payload?: unknown
}

export interface CloseBottomSheetAction extends ActionBase {
  type: 'close-bottom-sheet'
  sheet?: string
  result?: unknown
}

export interface ActionSheetAction extends ActionBase {
  type: 'action-sheet'
  title?: string
  options: Array<{ label: string; action: Action; destructive?: boolean }>
}

export interface HapticAction extends ActionBase {
  type: 'haptic'
  style?: ImpactStyle
  notification?: NotificationType
  selection?: boolean
}

export interface ShareAction extends ActionBase {
  type: 'share'
  message?: string
  url?: string
  title?: string
}

export interface ClipboardAction extends ActionBase {
  type: 'clipboard'
  text: string
}

export interface OpenUrlAction extends ActionBase {
  type: 'open-url'
  url: string
}

export interface CameraAction extends ActionBase {
  type: 'camera'
  resultTarget?: string
}

export interface MediaPickerAction extends ActionBase {
  type: 'media-picker'
  mediaType?: 'images' | 'videos' | 'all'
  multiple?: boolean
  resultTarget?: string
}

export interface ScanQrAction extends ActionBase {
  type: 'scan-qr'
  resultTarget?: string
}

export type NativeAction =
  | OpenBottomSheetAction
  | CloseBottomSheetAction
  | ActionSheetAction
  | HapticAction
  | ShareAction
  | ClipboardAction
  | OpenUrlAction
  | CameraAction
  | MediaPickerAction
  | ScanQrAction

export type Action = SharedAction | NativeAction
export type ActionType = Action['type']
export type ActionSequence = Action | Action[]

export type {
  ActionBase,
  ApiAction,
  BranchAction,
  CloseModalAction,
  ConfirmAction,
  CopyAction,
  CopyToClipboardAction,
  DownloadAction,
  EmitAction,
  ForEachAction,
  LogAction,
  NavigateAction,
  NavigateExternalAction,
  OpenModalAction,
  RefreshAction,
  RunWorkflowAction,
  ScrollToAction,
  SetThemeAction,
  SetValueAction,
  SharedAction,
  SubmitFormAction,
  ToastAction,
  TrackAction,
  WsSendAction,
}
