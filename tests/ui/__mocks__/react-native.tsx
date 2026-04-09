/**
 * Comprehensive React Native stub for vitest UI component tests.
 *
 * React Native ships Flow-typed JS that Node/esbuild can't parse. This mock
 * replaces the entire module with functional React stubs that react-test-renderer
 * and @testing-library/react-native can render and query.
 */
import React from 'react'

// ── Base stub factory ─────────────────────────────────────────────────────────

function stub(displayName: string) {
  const C = ({ children, ...props }: { children?: React.ReactNode; [key: string]: unknown }) =>
    React.createElement(displayName, props, children)
  C.displayName = displayName
  return C
}

// ── Core layout/view components ───────────────────────────────────────────────

export const View = stub('View')
export const Text = stub('Text')
export const ScrollView = stub('ScrollView')
export const SafeAreaView = stub('SafeAreaView')
export const KeyboardAvoidingView = stub('KeyboardAvoidingView')
export const Modal = stub('Modal')
export const RefreshControl = stub('RefreshControl')

// ── Interactive ───────────────────────────────────────────────────────────────

type TouchableProps = { onPress?: unknown; children?: React.ReactNode; [key: string]: unknown }

export const TouchableOpacity = ({ onPress, children, ...props }: TouchableProps) =>
  React.createElement('TouchableOpacity', { ...props, onPress }, children)
TouchableOpacity.displayName = 'TouchableOpacity'

export const TouchableWithoutFeedback = ({ onPress, children, ...props }: TouchableProps) =>
  React.createElement('TouchableWithoutFeedback', { ...props, onPress }, children)
TouchableWithoutFeedback.displayName = 'TouchableWithoutFeedback'

export const Pressable = ({ onPress, children, ...props }: TouchableProps) =>
  React.createElement('Pressable', { ...props, onPress }, children)
Pressable.displayName = 'Pressable'

// ── Form inputs ───────────────────────────────────────────────────────────────

export const TextInput = ({ onChangeText, value, ...props }: Record<string, unknown>) =>
  React.createElement('TextInput', { ...props, onChangeText, value })
TextInput.displayName = 'TextInput'

export const Switch = ({ onValueChange, value, ...props }: Record<string, unknown>) =>
  React.createElement('Switch', { ...props, onValueChange, value })
Switch.displayName = 'Switch'

// ── List ──────────────────────────────────────────────────────────────────────

export function FlatList<T>({
  data,
  renderItem,
  keyExtractor,
  ListEmptyComponent,
  ...props
}: {
  data?: T[] | null
  renderItem: (info: { item: T; index: number }) => React.ReactElement | null
  keyExtractor?: (item: T, index: number) => string
  ListEmptyComponent?: React.ReactElement | React.ComponentType
  [key: string]: unknown
}) {
  const items = data ?? []
  const empty =
    items.length === 0
      ? React.isValidElement(ListEmptyComponent)
        ? ListEmptyComponent
        : ListEmptyComponent
          ? React.createElement(ListEmptyComponent as React.ComponentType)
          : null
      : null

  return React.createElement(
    'FlatList',
    props,
    ...items.map((item, index) => {
      const key = keyExtractor ? keyExtractor(item, index) : String(index)
      const rendered = renderItem({ item, index })
      return rendered ? React.cloneElement(rendered, { key }) : null
    }),
    empty,
  )
}
FlatList.displayName = 'FlatList'

// ── Media ─────────────────────────────────────────────────────────────────────

export const Image = ({ source, ...props }: Record<string, unknown>) =>
  React.createElement('Image', { ...props, source })
Image.displayName = 'Image'
Image.getSize = (_uri: string, success: (w: number, h: number) => void) => success(100, 100)
Image.prefetch = () => Promise.resolve(true)

export const ActivityIndicator = stub('ActivityIndicator')

// ── Animated ──────────────────────────────────────────────────────────────────

class AnimatedValue {
  _value: number
  constructor(value: number) {
    this._value = value
  }
  setValue(v: number) {
    this._value = v
  }
  addListener(_cb: (state: { value: number }) => void) {
    return ''
  }
  removeListener(_id: string) {}
  removeAllListeners() {}
  interpolate(_config: unknown) {
    return new AnimatedValue(this._value)
  }
  resetAnimation(_cb?: () => void) {}
  stopAnimation(_cb?: () => void) {}
}

class AnimatedValueXY {
  x = new AnimatedValue(0)
  y = new AnimatedValue(0)
  setValue(_v: { x: number; y: number }) {}
  getLayout() {
    return { left: this.x, top: this.y }
  }
}

function timing(
  value: AnimatedValue,
  config: { toValue: number; duration?: number; useNativeDriver?: boolean },
) {
  return {
    start: (cb?: (result: { finished: boolean }) => void) => {
      value._value = config.toValue
      cb?.({ finished: true })
    },
    stop: () => {},
    reset: () => {},
  }
}

function spring(value: AnimatedValue, config: { toValue: number; useNativeDriver?: boolean }) {
  return timing(value, config)
}

function sequence(anims: Array<{ start: (cb?: () => void) => void }>) {
  return {
    start: (cb?: (result: { finished: boolean }) => void) => {
      let i = 0
      const next = () => {
        if (i < anims.length) {
          anims[i++]!.start(next)
        } else {
          cb?.({ finished: true })
        }
      }
      next()
    },
    stop: () => {},
    reset: () => {},
  }
}

function loop(anim: { start: (cb?: () => void) => void }) {
  return {
    start: (cb?: (result: { finished: boolean }) => void) => {
      anim.start(() => cb?.({ finished: true }))
    },
    stop: () => {},
    reset: () => {},
  }
}

function parallel(anims: Array<{ start: (cb?: () => void) => void }>) {
  return {
    start: (cb?: (result: { finished: boolean }) => void) => {
      let done = 0
      anims.forEach((a) =>
        a.start(() => {
          if (++done === anims.length) cb?.({ finished: true })
        }),
      )
    },
    stop: () => {},
    reset: () => {},
  }
}

const AnimatedText = stub('Animated.Text')
const AnimatedView = stub('Animated.View')

export const Animated = {
  Value: AnimatedValue,
  ValueXY: AnimatedValueXY,
  timing,
  spring,
  sequence,
  loop,
  parallel,
  decay: timing,
  delay: (_ms: number) => ({ start: (cb?: () => void) => cb?.(), stop: () => {}, reset: () => {} }),
  Text: AnimatedText,
  View: AnimatedView,
  Image: stub('Animated.Image'),
  ScrollView: stub('Animated.ScrollView'),
  FlatList: stub('Animated.FlatList'),
  createAnimatedComponent: (C: React.ComponentType) => C,
  event: () => () => {},
  add: (a: AnimatedValue, b: AnimatedValue) => new AnimatedValue(a._value + b._value),
  subtract: (a: AnimatedValue, b: AnimatedValue) => new AnimatedValue(a._value - b._value),
  multiply: (a: AnimatedValue, b: AnimatedValue) => new AnimatedValue(a._value * b._value),
  divide: (a: AnimatedValue, b: AnimatedValue) => new AnimatedValue(a._value / b._value),
}

// ── StyleSheet ────────────────────────────────────────────────────────────────

export const StyleSheet = {
  create: <T extends Record<string, unknown>>(styles: T): T => styles,
  flatten: (style: unknown) => (Array.isArray(style) ? Object.assign({}, ...style) : (style ?? {})),
  hairlineWidth: 0.5,
  absoluteFill: { position: 'absolute', left: 0, right: 0, top: 0, bottom: 0 },
  absoluteFillObject: { position: 'absolute', left: 0, right: 0, top: 0, bottom: 0 },
}

// ── Platform ──────────────────────────────────────────────────────────────────

export const Platform = {
  OS: 'ios' as const,
  Version: 18,
  isPad: false,
  isTVOS: false,
  isTV: false,
  select: <T extends Record<string, unknown>>(spec: T): T[keyof T] =>
    ((spec as Record<string, unknown>)['ios'] as T[keyof T]) ?? (spec['default'] as T[keyof T]),
}

// ── Dimensions ────────────────────────────────────────────────────────────────

export const Dimensions = {
  get: (_dim: string) => ({ width: 390, height: 844, scale: 3, fontScale: 1 }),
  addEventListener: (_event: string, _handler: () => void) => ({ remove: () => {} }),
  removeEventListener: () => {},
}

// ── Alert ─────────────────────────────────────────────────────────────────────

export const Alert = {
  alert: (_title: string, _message?: string, _buttons?: unknown[]) => {},
}

// ── Linking ───────────────────────────────────────────────────────────────────

export const Linking = {
  openURL: (_url: string) => Promise.resolve(),
  canOpenURL: (_url: string) => Promise.resolve(true),
  getInitialURL: () => Promise.resolve(null),
  addEventListener: (_event: string, _handler: () => void) => ({ remove: () => {} }),
}

// ── Appearance ────────────────────────────────────────────────────────────────

export const Appearance = {
  getColorScheme: () => 'light' as const,
  addChangeListener: (_cb: () => void) => ({ remove: () => {} }),
}

// ── AppState ──────────────────────────────────────────────────────────────────

export const AppState = {
  currentState: 'active' as const,
  addEventListener: (_event: string, _handler: () => void) => ({ remove: () => {} }),
}

// ── Share ─────────────────────────────────────────────────────────────────────

export const Share = {
  share: (_content: unknown, _options?: unknown) =>
    Promise.resolve({ action: 'sharedAction', activityType: undefined }),
  sharedAction: 'sharedAction',
  dismissedAction: 'dismissedAction',
}

// ── Keyboard ──────────────────────────────────────────────────────────────────

export const Keyboard = {
  dismiss: () => {},
  addListener: (_event: string, _handler: () => void) => ({ remove: () => {} }),
}

// ── PanResponder ──────────────────────────────────────────────────────────────

export const PanResponder = {
  create: (_config: Record<string, unknown>) => ({
    panHandlers: {
      onStartShouldSetResponder: () => false,
      onMoveShouldSetResponder: () => false,
      onResponderGrant: () => {},
      onResponderMove: () => {},
      onResponderRelease: () => {},
      onResponderTerminate: () => {},
    },
  }),
}

// ── Vibration ─────────────────────────────────────────────────────────────────

export const Vibration = { vibrate: () => {}, cancel: () => {} }

// ── PixelRatio ────────────────────────────────────────────────────────────────

export const PixelRatio = {
  get: () => 3,
  getFontScale: () => 1,
  getPixelSizeForLayoutSize: (size: number) => size * 3,
  roundToNearestPixel: (size: number) => size,
}

// ── Defaults ──────────────────────────────────────────────────────────────────

export default {
  View,
  Text,
  ScrollView,
  SafeAreaView,
  KeyboardAvoidingView,
  Modal,
  RefreshControl,
  TouchableOpacity,
  TouchableWithoutFeedback,
  Pressable,
  TextInput,
  Switch,
  FlatList,
  Image,
  ActivityIndicator,
  Animated,
  StyleSheet,
  Platform,
  Dimensions,
  Alert,
  Linking,
  Appearance,
  AppState,
  Share,
  Keyboard,
  PanResponder,
  Vibration,
  PixelRatio,
}
