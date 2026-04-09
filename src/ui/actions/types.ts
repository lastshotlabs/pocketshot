/** Impact style for haptic feedback — maps to expo-haptics ImpactFeedbackStyle. */
export type ImpactStyle = 'light' | 'medium' | 'heavy' | 'soft' | 'rigid'

/** Notification type for haptic feedback — maps to expo-haptics NotificationFeedbackType. */
export type NotificationType = 'success' | 'warning' | 'error'

/** All supported action types in the config-driven action vocabulary. */
export type ActionType =
  | 'navigate'
  | 'api'
  | 'open-bottom-sheet'
  | 'close-bottom-sheet'
  | 'open-modal'
  | 'close-modal'
  | 'action-sheet'
  | 'refresh'
  | 'set-value'
  | 'toast'
  | 'haptic'
  | 'share'
  | 'clipboard'
  | 'confirm'
  | 'open-url'
  | 'run-workflow'
  | 'camera'
  | 'media-picker'
  | 'scan-qr'

export interface NavigateAction {
  type: 'navigate'
  path: string
  params?: Record<string, string>
  replace?: boolean
}

export interface ApiAction {
  type: 'api'
  method: 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE'
  path: string
  body?: Record<string, unknown>
  /** If set, store the response under this key in ScreenContext. */
  resultKey?: string
  /** Action to dispatch on success. */
  onSuccess?: Action
  /** Action to dispatch on error. Error message stored as `__apiError` in ScreenContext. */
  onError?: Action
}

export interface OpenBottomSheetAction {
  type: 'open-bottom-sheet'
  sheetId: string
}

export interface CloseBottomSheetAction {
  type: 'close-bottom-sheet'
  sheetId: string
}

export interface OpenModalAction {
  type: 'open-modal'
  modalId: string
}

export interface CloseModalAction {
  type: 'close-modal'
  modalId: string
}

export interface ActionSheetAction {
  type: 'action-sheet'
  title?: string
  options: Array<{ label: string; action: Action; destructive?: boolean }>
}

export interface RefreshAction {
  type: 'refresh'
  /** Query key to invalidate. Invalidates all if omitted. */
  queryKey?: string[]
}

export interface SetValueAction {
  type: 'set-value'
  key: string
  value: unknown
}

export interface ToastAction {
  type: 'toast'
  message: string
  variant?: 'success' | 'error' | 'warning' | 'info'
  duration?: number
}

export interface HapticAction {
  type: 'haptic'
  style?: ImpactStyle
  notification?: NotificationType
  selection?: boolean
}

export interface ShareAction {
  type: 'share'
  message?: string
  url?: string
  title?: string
}

export interface ClipboardAction {
  type: 'clipboard'
  text: string
}

export interface ConfirmAction {
  type: 'confirm'
  title: string
  message?: string
  confirmLabel?: string
  cancelLabel?: string
  onConfirm: Action
  onCancel?: Action
}

export interface OpenUrlAction {
  type: 'open-url'
  url: string
}

export interface RunWorkflowAction {
  type: 'run-workflow'
  workflowId: string
  params?: Record<string, unknown>
}

export interface CameraAction {
  type: 'camera'
  /** Key to store the captured image URI under in ScreenContext. */
  resultKey?: string
}

export interface MediaPickerAction {
  type: 'media-picker'
  mediaType?: 'images' | 'videos' | 'all'
  multiple?: boolean
  resultKey?: string
}

export interface ScanQrAction {
  type: 'scan-qr'
  resultKey?: string
}

/** Discriminated union of all possible actions. */
export type Action =
  | NavigateAction
  | ApiAction
  | OpenBottomSheetAction
  | CloseBottomSheetAction
  | OpenModalAction
  | CloseModalAction
  | ActionSheetAction
  | RefreshAction
  | SetValueAction
  | ToastAction
  | HapticAction
  | ShareAction
  | ClipboardAction
  | ConfirmAction
  | OpenUrlAction
  | RunWorkflowAction
  | CameraAction
  | MediaPickerAction
  | ScanQrAction
