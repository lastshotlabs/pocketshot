import React, { useCallback, useEffect, useRef, type ReactNode } from 'react'
import {
  Animated,
  Dimensions,
  PanResponder,
  StyleSheet,
  Text,
  TouchableWithoutFeedback,
  View,
} from 'react-native'
import { ComponentWrapper } from '../../_base/ComponentWrapper'
import { useTokens } from '../../../context/AppContext'
import { useScreenContext } from '../../../context/ScreenContext'
import type { DesignTokens } from '../../../tokens/types'
import type { BottomSheetConfig } from './types'

// ── Gorhom lazy loader (optional peer dep) ─────────────────────────────────────

// We cannot statically import @gorhom/bottom-sheet — it is an optional peer.
// We duck-type the minimum surface we use so tsc does not need the module.

interface GorhomModule {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  BottomSheet: React.ComponentType<any>
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  BottomSheetView: React.ComponentType<any>
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  BottomSheetBackdrop: React.ComponentType<any>
}

interface GorhomSheetRef {
  expand(): void
  close(): void
}

let _gorhomCache: GorhomModule | null | undefined

function tryGorhom(): GorhomModule | null {
  if (_gorhomCache !== undefined) return _gorhomCache
  try {
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    _gorhomCache = require('@gorhom/bottom-sheet') as GorhomModule
  } catch {
    _gorhomCache = null
  }
  return _gorhomCache
}

// ── Custom bottom sheet (Animated + PanResponder fallback) ─────────────────────

const WINDOW_HEIGHT = Dimensions.get('window').height

function parseSnapPoint(point: string): number {
  if (point.endsWith('%')) {
    const pct = parseFloat(point) / 100
    return WINDOW_HEIGHT * pct
  }
  return parseFloat(point)
}

interface CustomBottomSheetProps {
  config: BottomSheetConfig
  isOpen: boolean
  onClose: () => void
  tokens: DesignTokens
  children?: ReactNode
}

function CustomBottomSheet({ config, isOpen, onClose, tokens, children }: CustomBottomSheetProps) {
  const snapHeights = (config.snapPoints ?? ['50%']).map(parseSnapPoint)
  const primaryHeight =
    snapHeights[Math.floor(snapHeights.length / 2)] ?? snapHeights[0] ?? WINDOW_HEIGHT * 0.5

  const translateY = useRef(new Animated.Value(WINDOW_HEIGHT)).current
  const backdropOpacity = useRef(new Animated.Value(0)).current

  const animateOpen = useCallback(() => {
    Animated.parallel([
      Animated.timing(translateY, {
        toValue: WINDOW_HEIGHT - primaryHeight,
        duration: 300,
        useNativeDriver: true,
      }),
      Animated.timing(backdropOpacity, {
        toValue: 1,
        duration: 300,
        useNativeDriver: true,
      }),
    ]).start()
  }, [translateY, backdropOpacity, primaryHeight])

  const animateClose = useCallback(() => {
    Animated.parallel([
      Animated.timing(translateY, {
        toValue: WINDOW_HEIGHT,
        duration: 250,
        useNativeDriver: true,
      }),
      Animated.timing(backdropOpacity, {
        toValue: 0,
        duration: 250,
        useNativeDriver: true,
      }),
    ]).start()
  }, [translateY, backdropOpacity])

  useEffect(() => {
    if (isOpen) {
      animateOpen()
    } else {
      animateClose()
    }
  }, [isOpen, animateOpen, animateClose])

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
        } else {
          Animated.spring(translateY, {
            toValue: WINDOW_HEIGHT - primaryHeight,
            useNativeDriver: true,
          }).start()
        }
      },
    }),
  ).current

  const styles = makeCustomStyles(tokens)

  return (
    <>
      {/* Backdrop */}
      <TouchableWithoutFeedback
        onPress={config.closeOnBackdrop ? onClose : undefined}
        accessibilityLabel="Close sheet"
        accessibilityRole="button"
      >
        <Animated.View
          style={[StyleSheet.absoluteFill, styles.backdrop, { opacity: backdropOpacity }]}
        />
      </TouchableWithoutFeedback>

      {/* Sheet panel */}
      <Animated.View
        style={[
          styles.sheet,
          {
            height: primaryHeight,
            transform: [{ translateY }],
          },
        ]}
        {...panResponder.panHandlers}
      >
        {config.showHandle && (
          <View style={styles.handleContainer} accessible={false}>
            <View style={styles.handle} />
          </View>
        )}
        {config.title != null && (
          <Text style={styles.title} accessibilityRole="header">
            {config.title}
          </Text>
        )}
        <View style={styles.content}>{children}</View>
      </Animated.View>
    </>
  )
}

function makeCustomStyles(tokens: DesignTokens) {
  return StyleSheet.create({
    backdrop: {
      backgroundColor: tokens.colors.overlay,
    },
    sheet: {
      position: 'absolute',
      left: 0,
      right: 0,
      bottom: 0,
      backgroundColor: tokens.colors.surface,
      borderTopLeftRadius: tokens.radius.lg,
      borderTopRightRadius: tokens.radius.lg,
      ...tokens.shadows.lg,
    },
    handleContainer: {
      alignItems: 'center',
      paddingTop: tokens.spacing[2],
      paddingBottom: tokens.spacing[1],
    },
    handle: {
      width: 40,
      height: 4,
      borderRadius: tokens.radius.full,
      backgroundColor: tokens.colors.border,
    },
    title: {
      fontSize: tokens.typography.fontSizeLg,
      fontWeight: tokens.typography.fontWeightSemibold,
      color: tokens.colors.text,
      paddingHorizontal: tokens.spacing[4],
      paddingVertical: tokens.spacing[3],
    },
    content: {
      flex: 1,
    },
  })
}

// ── Gorhom adapter component ────────────────────────────────────────────────────

interface GorhomBottomSheetProps {
  config: BottomSheetConfig
  isOpen: boolean
  onClose: () => void
  tokens: DesignTokens
  children?: ReactNode
  gorhom: GorhomModule
}

function GorhomBottomSheet({
  config,
  isOpen,
  onClose,
  tokens,
  children,
  gorhom,
}: GorhomBottomSheetProps) {
  const { BottomSheet: GSheet, BottomSheetView, BottomSheetBackdrop } = gorhom
  const sheetRef = useRef<GorhomSheetRef>(null)

  useEffect(() => {
    if (isOpen) {
      sheetRef.current?.expand()
    } else {
      sheetRef.current?.close()
    }
  }, [isOpen])

  const renderBackdrop = useCallback(
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (props: Record<string, unknown>) => (
      <BottomSheetBackdrop
        {...props}
        disappearsOnIndex={-1}
        appearsOnIndex={0}
        onPress={config.closeOnBackdrop ? onClose : undefined}
      />
    ),
    [BottomSheetBackdrop, config.closeOnBackdrop, onClose],
  )

  return (
    <GSheet
      ref={sheetRef}
      index={-1}
      snapPoints={config.snapPoints}
      enablePanDownToClose
      onClose={onClose}
      handleIndicatorStyle={
        config.showHandle ? { backgroundColor: tokens.colors.border, width: 40 } : { height: 0 }
      }
      backgroundStyle={{
        backgroundColor: tokens.colors.surface,
        borderRadius: tokens.radius.lg,
      }}
      backdropComponent={renderBackdrop}
    >
      <BottomSheetView style={{ flex: 1 }}>
        {config.title != null && (
          <Text
            style={{
              fontSize: tokens.typography.fontSizeLg,
              fontWeight: tokens.typography.fontWeightSemibold,
              color: tokens.colors.text,
              paddingHorizontal: tokens.spacing[4],
              paddingVertical: tokens.spacing[3],
            }}
            accessibilityRole="header"
          >
            {config.title}
          </Text>
        )}
        {children}
      </BottomSheetView>
    </GSheet>
  )
}

// ── Public component ───────────────────────────────────────────────────────────

export interface BottomSheetProps {
  config: BottomSheetConfig
  children?: ReactNode
}

/**
 * Config-driven bottom sheet. Open/close via ScreenContext key `__sheet_{id}`.
 *
 * Uses @gorhom/bottom-sheet when available; falls back to a custom
 * Animated + PanResponder implementation when it is not installed.
 */
export function BottomSheet({ config, children }: BottomSheetProps) {
  const tokens = useTokens()
  const { getValue, setValue } = useScreenContext()

  const isOpen = Boolean(getValue(`__sheet_${config.id}`))

  function handleClose() {
    setValue(`__sheet_${config.id}`, false)
  }

  const gorhom = tryGorhom()

  if (gorhom) {
    return (
      <ComponentWrapper
        id={config.id}
        testID={config.testID}
        config={config}
        activeStates={isOpen ? ['open'] : undefined}
      >
        <GorhomBottomSheet
          config={config}
          isOpen={isOpen}
          onClose={handleClose}
          tokens={tokens}
          gorhom={gorhom}
        >
          {children}
        </GorhomBottomSheet>
      </ComponentWrapper>
    )
  }

  return (
    <ComponentWrapper
      id={config.id}
      testID={config.testID}
      config={config}
      activeStates={isOpen ? ['open'] : undefined}
    >
      <CustomBottomSheet config={config} isOpen={isOpen} onClose={handleClose} tokens={tokens}>
        {children}
      </CustomBottomSheet>
    </ComponentWrapper>
  )
}
