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
import { ComponentWrapper } from '../../_base/ComponentWrapper'
import { resolveNativeTextStyle, resolveSurfacePresentation } from '../../_base'
import { useTokens } from '../../../context/AppContext'
import { useScreenContext } from '../../../context/ScreenContext'
import type { DesignTokens } from '../../../tokens/types'
import type { BottomSheetConfig } from './types'

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

function parseSnapPoint(point: string): number {
  if (point.endsWith('%')) {
    return WINDOW_HEIGHT * (parseFloat(point) / 100)
  }
  return parseFloat(point)
}

function resolveBottomSheetPresentation(config: BottomSheetConfig, tokens: DesignTokens) {
  const sharedTextStyle = resolveNativeTextStyle(config as Record<string, unknown>, tokens)
  const baseTextStyle: TextStyle = {
    fontSize:
      typeof sharedTextStyle.fontSize === 'number'
        ? sharedTextStyle.fontSize
        : undefined,
    fontWeight:
      typeof sharedTextStyle.fontWeight === 'string' ? sharedTextStyle.fontWeight : undefined,
    lineHeight:
      typeof sharedTextStyle.lineHeight === 'number' ? sharedTextStyle.lineHeight : undefined,
    letterSpacing:
      typeof sharedTextStyle.letterSpacing === 'number'
        ? sharedTextStyle.letterSpacing
        : undefined,
    textAlign:
      typeof sharedTextStyle.textAlign === 'string' ? sharedTextStyle.textAlign : undefined,
    opacity: typeof sharedTextStyle.opacity === 'number' ? sharedTextStyle.opacity : undefined,
  }

  return {
    baseTextStyle,
    backdropSurface: resolveSurfacePresentation({
      tokens,
      implementationBase: {
        bg: 'rgba(0,0,0,0.55)',
      },
      componentSurface: config.slots?.backdrop as Record<string, unknown> | undefined,
    }),
    panelSurface: resolveSurfacePresentation({
      tokens,
      implementationBase: {
        bg: 'card',
        borderRadius: 'lg',
        shadow: 'lg',
        overflow: 'hidden',
      },
      componentSurface: config.slots?.panel as Record<string, unknown> | undefined,
    }),
    handleContainerSurface: resolveSurfacePresentation({
      tokens,
      implementationBase: {
        alignItems: 'center',
        paddingTop: 'xs',
        paddingBottom: 'xs',
      },
      componentSurface: config.slots?.handleContainer as Record<string, unknown> | undefined,
    }),
    handleSurface: resolveSurfacePresentation({
      tokens,
      implementationBase: {
        width: 40,
        height: 4,
        borderRadius: 'full',
        bg: 'border',
      },
      componentSurface: config.slots?.handle as Record<string, unknown> | undefined,
    }),
    titleSurface: resolveSurfacePresentation({
      tokens,
      implementationBase: {
        fontSize: 'lg',
        fontWeight: 'semibold',
        color: 'foreground',
        paddingX: 'md',
        paddingY: 'sm',
      },
      componentSurface: config.slots?.title as Record<string, unknown> | undefined,
    }),
    contentSurface: resolveSurfacePresentation({
      tokens,
      implementationBase: {
        flex: 1,
      },
      componentSurface: config.slots?.content as Record<string, unknown> | undefined,
    }),
  }
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

  const {
    baseTextStyle,
    backdropSurface,
    panelSurface,
    handleContainerSurface,
    handleSurface,
    titleSurface,
    contentSurface,
  } = resolveBottomSheetPresentation(config, tokens)

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
  }, [backdropOpacity, primaryHeight, translateY])

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
  }, [backdropOpacity, translateY])

  useEffect(() => {
    if (isOpen) {
      animateOpen()
      return
    }

    animateClose()
  }, [animateClose, animateOpen, isOpen])

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
        onPress={config.closeOnBackdrop ? onClose : undefined}
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
        {config.showHandle ? (
          <View style={handleContainerSurface.style as ViewStyle | undefined} accessible={false}>
            <View style={handleSurface.style as ViewStyle | undefined} />
          </View>
        ) : null}
        {config.title != null ? (
          <Text
            style={{
              ...baseTextStyle,
              ...(titleSurface.style as TextStyle | undefined),
            }}
            accessibilityRole="header"
          >
            {config.title}
          </Text>
        ) : null}
        <View style={contentSurface.style as ViewStyle | undefined}>{children}</View>
      </Animated.View>
    </>
  )
}

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
  const {
    baseTextStyle,
    panelSurface,
    handleSurface,
    titleSurface,
    contentSurface,
  } = resolveBottomSheetPresentation(config, tokens)

  useEffect(() => {
    if (isOpen) {
      sheetRef.current?.expand()
      return
    }

    sheetRef.current?.close()
  }, [isOpen])

  const renderBackdrop = useCallback(
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
      ref={sheetRef as unknown as React.Ref<Record<string, unknown>>}
      index={-1}
      snapPoints={config.snapPoints}
      enablePanDownToClose
      onClose={onClose}
      handleIndicatorStyle={
        config.showHandle
          ? (handleSurface.style as ViewStyle | undefined)
          : { height: 0 }
      }
      backgroundStyle={panelSurface.style as ViewStyle | undefined}
      backdropComponent={renderBackdrop}
    >
      <BottomSheetView style={contentSurface.style as ViewStyle | undefined}>
        {config.title != null ? (
          <Text
            style={{
              ...baseTextStyle,
              ...(titleSurface.style as TextStyle | undefined),
            }}
            accessibilityRole="header"
          >
            {config.title}
          </Text>
        ) : null}
        {children}
      </BottomSheetView>
    </GSheet>
  )
}

export interface BottomSheetProps {
  config: BottomSheetConfig
  children?: ReactNode
}

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
