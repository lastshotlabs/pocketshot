import React, { useCallback, useEffect, useRef, type ReactNode } from 'react'
import {
  Animated,
  Dimensions,
  PanResponder,
  Text,
  TouchableWithoutFeedback,
  View,
  type TextStyle,
  type ViewStyle,
} from 'react-native'
import { resolveNativeTextStyle } from '../../_base/text-style'
import { resolveSurfacePresentation } from '../../_base/style-surfaces'
import { useTokens } from '../../../context/AppContext'

interface GorhomModule {
  BottomSheet: React.ComponentType<Record<string, unknown>>
  BottomSheetView: React.ComponentType<Record<string, unknown>>
  BottomSheetBackdrop: React.ComponentType<Record<string, unknown>>
}

interface GorhomSheetRef {
  expand(): void
  close(): void
}

let gorhomCache: GorhomModule | null | undefined

function tryGorhom(): GorhomModule | null {
  if (gorhomCache !== undefined) return gorhomCache
  try {
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    gorhomCache = require('@gorhom/bottom-sheet') as GorhomModule
  } catch {
    gorhomCache = null
  }
  return gorhomCache
}

const WINDOW_HEIGHT = Dimensions.get('window').height

function parseSnapPoint(point: string | number): number {
  if (typeof point === 'number') return point
  if (point.endsWith('%')) {
    return WINDOW_HEIGHT * (parseFloat(point) / 100)
  }
  return parseFloat(point)
}

export interface BottomSheetBaseProps {
  visible: boolean
  onClose: () => void
  title?: string
  /** Snap points (e.g. ['25%', '50%', '90%'] or pixels). */
  snapPoints?: Array<string | number>
  /** Show top drag handle. Default true. */
  showHandle?: boolean
  /** Close when backdrop pressed. Default true. */
  closeOnBackdrop?: boolean
  style?: ViewStyle
  slots?: Record<string, Record<string, unknown>>
  testID?: string
  id?: string
  children?: ReactNode
}

interface InternalProps extends BottomSheetBaseProps {
  visible: boolean
  onClose: () => void
}

function CustomBottomSheet({
  visible,
  onClose,
  title,
  snapPoints,
  showHandle,
  closeOnBackdrop,
  slots,
  children,
}: InternalProps) {
  const tokens = useTokens()
  const sharedTextStyle = resolveNativeTextStyle({}, tokens)
  const heights = (snapPoints ?? ['50%']).map(parseSnapPoint)
  const primaryHeight =
    heights[Math.floor(heights.length / 2)] ?? heights[0] ?? WINDOW_HEIGHT * 0.5

  const translateY = useRef(new Animated.Value(WINDOW_HEIGHT)).current
  const backdropOpacity = useRef(new Animated.Value(0)).current

  const backdropSurface = resolveSurfacePresentation({
    tokens,
    implementationBase: { bg: 'rgba(0,0,0,0.55)' },
    componentSurface: slots?.backdrop,
  })
  const panelSurface = resolveSurfacePresentation({
    tokens,
    implementationBase: {
      bg: 'card',
      borderRadius: 'lg',
      shadow: 'lg',
      overflow: 'hidden',
    },
    componentSurface: slots?.panel,
  })
  const handleContainerSurface = resolveSurfacePresentation({
    tokens,
    implementationBase: { alignItems: 'center', paddingTop: 'xs', paddingBottom: 'xs' },
    componentSurface: slots?.handleContainer,
  })
  const handleSurface = resolveSurfacePresentation({
    tokens,
    implementationBase: { width: 40, height: 4, borderRadius: 'full', bg: 'border' },
    componentSurface: slots?.handle,
  })
  const titleSurface = resolveSurfacePresentation({
    tokens,
    implementationBase: {
      fontSize: 'lg',
      fontWeight: 'semibold',
      color: 'foreground',
      paddingX: 'md',
      paddingY: 'sm',
    },
    componentSurface: slots?.title,
  })
  const contentSurface = resolveSurfacePresentation({
    tokens,
    implementationBase: { flex: 1 },
    componentSurface: slots?.content,
  })

  const animateOpen = useCallback(() => {
    Animated.parallel([
      Animated.timing(translateY, {
        toValue: WINDOW_HEIGHT - primaryHeight,
        duration: 300,
        useNativeDriver: true,
      }),
      Animated.timing(backdropOpacity, { toValue: 1, duration: 300, useNativeDriver: true }),
    ]).start()
  }, [backdropOpacity, primaryHeight, translateY])

  const animateClose = useCallback(() => {
    Animated.parallel([
      Animated.timing(translateY, {
        toValue: WINDOW_HEIGHT,
        duration: 250,
        useNativeDriver: true,
      }),
      Animated.timing(backdropOpacity, { toValue: 0, duration: 250, useNativeDriver: true }),
    ]).start()
  }, [backdropOpacity, translateY])

  useEffect(() => {
    if (visible) animateOpen()
    else animateClose()
  }, [visible, animateOpen, animateClose])

  const panResponder = useRef(
    PanResponder.create({
      onMoveShouldSetPanResponder: (_, gestureState) => gestureState.dy > 5,
      onPanResponderMove: (_, gestureState) => {
        if (gestureState.dy > 0) {
          translateY.setValue(WINDOW_HEIGHT - primaryHeight + gestureState.dy)
        }
      },
      onPanResponderRelease: (_, gestureState) => {
        if (gestureState.dy > primaryHeight * 0.3 || gestureState.vy > 0.5) {
          onClose()
          return
        }
        Animated.spring(translateY, {
          toValue: WINDOW_HEIGHT - primaryHeight,
          useNativeDriver: true,
        }).start()
      },
    }),
  ).current

  return (
    <>
      <TouchableWithoutFeedback
        onPress={closeOnBackdrop ? onClose : undefined}
        accessibilityLabel="Close sheet"
        accessibilityRole="button"
      >
        <Animated.View
          style={[
            {
              position: 'absolute',
              top: 0,
              right: 0,
              bottom: 0,
              left: 0,
              opacity: backdropOpacity,
            },
            backdropSurface.style as ViewStyle | undefined,
          ]}
        />
      </TouchableWithoutFeedback>
      <Animated.View
        style={[
          {
            position: 'absolute',
            left: 0,
            right: 0,
            bottom: 0,
            height: primaryHeight,
            transform: [{ translateY }],
          },
          panelSurface.style as ViewStyle | undefined,
        ]}
        {...panResponder.panHandlers}
      >
        {showHandle ? (
          <View style={handleContainerSurface.style as ViewStyle | undefined} accessible={false}>
            <View style={handleSurface.style as ViewStyle | undefined} />
          </View>
        ) : null}
        {title != null ? (
          <Text
            style={{
              ...sharedTextStyle,
              ...(titleSurface.style as TextStyle | undefined),
            }}
            accessibilityRole="header"
          >
            {title}
          </Text>
        ) : null}
        <View style={contentSurface.style as ViewStyle | undefined}>{children}</View>
      </Animated.View>
    </>
  )
}

function GorhomBottomSheet({
  visible,
  onClose,
  title,
  snapPoints,
  showHandle,
  closeOnBackdrop,
  slots,
  children,
  gorhom,
}: InternalProps & { gorhom: GorhomModule }) {
  const tokens = useTokens()
  const sharedTextStyle = resolveNativeTextStyle({}, tokens)
  const { BottomSheet: GSheet, BottomSheetView, BottomSheetBackdrop } = gorhom
  const sheetRef = useRef<GorhomSheetRef>(null)

  const panelSurface = resolveSurfacePresentation({
    tokens,
    implementationBase: {
      bg: 'card',
      borderRadius: 'lg',
      shadow: 'lg',
      overflow: 'hidden',
    },
    componentSurface: slots?.panel,
  })
  const handleSurface = resolveSurfacePresentation({
    tokens,
    implementationBase: { width: 40, height: 4, borderRadius: 'full', bg: 'border' },
    componentSurface: slots?.handle,
  })
  const titleSurface = resolveSurfacePresentation({
    tokens,
    implementationBase: {
      fontSize: 'lg',
      fontWeight: 'semibold',
      color: 'foreground',
      paddingX: 'md',
      paddingY: 'sm',
    },
    componentSurface: slots?.title,
  })
  const contentSurface = resolveSurfacePresentation({
    tokens,
    implementationBase: { flex: 1 },
    componentSurface: slots?.content,
  })

  useEffect(() => {
    if (visible) sheetRef.current?.expand()
    else sheetRef.current?.close()
  }, [visible])

  const renderBackdrop = useCallback(
    (props: Record<string, unknown>) => (
      <BottomSheetBackdrop
        {...props}
        disappearsOnIndex={-1}
        appearsOnIndex={0}
        onPress={closeOnBackdrop ? onClose : undefined}
      />
    ),
    [BottomSheetBackdrop, closeOnBackdrop, onClose],
  )

  return (
    <GSheet
      ref={sheetRef as unknown as React.Ref<Record<string, unknown>>}
      index={-1}
      snapPoints={snapPoints}
      enablePanDownToClose
      onClose={onClose}
      handleIndicatorStyle={
        showHandle ? (handleSurface.style as ViewStyle | undefined) : { height: 0 }
      }
      backgroundStyle={panelSurface.style as ViewStyle | undefined}
      backdropComponent={renderBackdrop}
    >
      <BottomSheetView style={contentSurface.style as ViewStyle | undefined}>
        {title != null ? (
          <Text
            style={{
              ...sharedTextStyle,
              ...(titleSurface.style as TextStyle | undefined),
            }}
            accessibilityRole="header"
          >
            {title}
          </Text>
        ) : null}
        {children}
      </BottomSheetView>
    </GSheet>
  )
}

/**
 * Standalone BottomSheet — plain React props, no manifest required.
 *
 * @example
 * <BottomSheetBase visible={open} onClose={() => setOpen(false)} title="Sort">
 *   <Text>Body</Text>
 * </BottomSheetBase>
 */
export function BottomSheetBase(props: BottomSheetBaseProps) {
  const {
    visible,
    onClose,
    showHandle = true,
    closeOnBackdrop = true,
    snapPoints = ['50%'],
  } = props
  const gorhom = tryGorhom()

  if (gorhom) {
    return (
      <GorhomBottomSheet
        {...props}
        visible={visible}
        onClose={onClose}
        showHandle={showHandle}
        closeOnBackdrop={closeOnBackdrop}
        snapPoints={snapPoints}
        gorhom={gorhom}
      />
    )
  }

  return (
    <CustomBottomSheet
      {...props}
      visible={visible}
      onClose={onClose}
      showHandle={showHandle}
      closeOnBackdrop={closeOnBackdrop}
      snapPoints={snapPoints}
    />
  )
}
