import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import {
  Animated,
  Text,
  TextInput,
  TouchableOpacity,
  View,
  type TextStyle,
  type ViewStyle,
} from 'react-native'
import { ComponentWrapper } from '../../_base/ComponentWrapper'
import { resolveNativeTextStyle, resolveSurfacePresentation } from '../../_base'
import { useTokens } from '../../../context/AppContext'
import { useScreenContext } from '../../../context/ScreenContext'
import { resolveFromRef } from '../../_base/fromRef'
import type { DesignTokens } from '../../../tokens/types'
import type { QrScannerConfig } from './types'

interface BarcodeScanningResult {
  type: string
  data: string
}

interface CameraViewProps {
  style?: unknown
  facing?: 'back' | 'front'
  enableTorch?: boolean
  barcodeScannerSettings?: { barcodeTypes: string[] }
  onBarcodeScanned?: (result: BarcodeScanningResult) => void
  children?: React.ReactNode
}

type CameraViewComponent = React.ComponentType<CameraViewProps>

let CameraView: CameraViewComponent | null = null
let useCameraPermissions: (() => [{ granted: boolean } | null, () => Promise<unknown>]) | null =
  null

try {
  // eslint-disable-next-line @typescript-eslint/no-var-requires
  const mod = require('expo-camera') as {
    CameraView: CameraViewComponent
    useCameraPermissions: () => [{ granted: boolean } | null, () => Promise<unknown>]
  }
  CameraView = mod.CameraView
  useCameraPermissions = mod.useCameraPermissions
} catch {
  // expo-camera is optional
}

const SCAN_AREA_SIZE = 250

function resolveSlotSurface(
  config: QrScannerConfig,
  tokens: DesignTokens,
  slot: string,
  implementationBase?: Record<string, unknown>,
) {
  return resolveSurfacePresentation({
    tokens,
    implementationBase,
    componentSurface:
      (config.slots as Record<string, Record<string, unknown> | undefined> | undefined)?.[slot],
  })
}

function mergeTextStyle(
  sharedTextStyle: TextStyle,
  surface: ReturnType<typeof resolveSurfacePresentation>,
): TextStyle {
  return {
    ...sharedTextStyle,
    ...(surface.style as TextStyle | undefined),
  }
}

function ScanOverlay({
  config,
  overlayText,
  sharedTextStyle,
}: {
  config: QrScannerConfig
  overlayText?: string
  sharedTextStyle: TextStyle
}) {
  const tokens = useTokens()
  const scanLineY = useRef(new Animated.Value(0)).current

  useEffect(() => {
    const animation = Animated.loop(
      Animated.sequence([
        Animated.timing(scanLineY, {
          toValue: SCAN_AREA_SIZE - 2,
          duration: 2000,
          useNativeDriver: true,
        }),
        Animated.timing(scanLineY, {
          toValue: 0,
          duration: 2000,
          useNativeDriver: true,
        }),
      ]),
    )

    animation.start()
    return () => animation.stop()
  }, [scanLineY])

  const overlayContainerSurface = resolveSlotSurface(config, tokens, 'overlayContainer', {
    position: 'absolute',
    inset: 0,
  })
  const topOverlaySurface = resolveSlotSurface(config, tokens, 'topOverlay', {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
  })
  const middleRowSurface = resolveSlotSurface(config, tokens, 'middleRow', {
    flexDirection: 'row',
    height: SCAN_AREA_SIZE,
  })
  const sideOverlaySurface = resolveSlotSurface(config, tokens, 'sideOverlay', {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
  })
  const scanAreaSurface = resolveSlotSurface(config, tokens, 'scanArea', {
    width: SCAN_AREA_SIZE,
    height: SCAN_AREA_SIZE,
    overflow: 'hidden',
  })
  const cornerSurface = resolveSlotSurface(config, tokens, 'corner', {
    width: 24,
    height: 24,
    borderColor: tokens.colors.primary,
    borderWidth: 3,
    position: 'absolute',
  })
  const scanLineSurface = resolveSlotSurface(config, tokens, 'scanLine', {
    width: SCAN_AREA_SIZE,
    height: 2,
    backgroundColor: tokens.colors.primary,
  })
  const bottomOverlaySurface = resolveSlotSurface(config, tokens, 'bottomOverlay', {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    alignItems: 'center',
    paddingTop: 'lg',
  })
  const overlayTextSurface = resolveSlotSurface(config, tokens, 'overlayText', {
    color: '#FFFFFF',
    fontSize: 'base',
    fontWeight: 'medium',
  })

  return (
    <View style={overlayContainerSurface.style as ViewStyle | undefined} pointerEvents="none">
      <View style={topOverlaySurface.style as ViewStyle | undefined} />
      <View style={middleRowSurface.style as ViewStyle | undefined}>
        <View style={sideOverlaySurface.style as ViewStyle | undefined} />
        <View style={scanAreaSurface.style as ViewStyle | undefined}>
          <View
            style={[
              cornerSurface.style as ViewStyle | undefined,
              { top: 0, left: 0, borderRightWidth: 0, borderBottomWidth: 0 },
            ]}
          />
          <View
            style={[
              cornerSurface.style as ViewStyle | undefined,
              { top: 0, right: 0, borderLeftWidth: 0, borderBottomWidth: 0 },
            ]}
          />
          <View
            style={[
              cornerSurface.style as ViewStyle | undefined,
              { bottom: 0, left: 0, borderRightWidth: 0, borderTopWidth: 0 },
            ]}
          />
          <View
            style={[
              cornerSurface.style as ViewStyle | undefined,
              { bottom: 0, right: 0, borderLeftWidth: 0, borderTopWidth: 0 },
            ]}
          />
          <Animated.View
            style={[
              scanLineSurface.style as ViewStyle | undefined,
              { transform: [{ translateY: scanLineY }] },
            ]}
          />
        </View>
        <View style={sideOverlaySurface.style as ViewStyle | undefined} />
      </View>
      <View style={bottomOverlaySurface.style as ViewStyle | undefined}>
        {overlayText != null ? (
          <Text style={mergeTextStyle(sharedTextStyle, overlayTextSurface)}>{overlayText}</Text>
        ) : null}
      </View>
    </View>
  )
}

function FallbackScanner({
  config,
  onManualEntry,
  sharedTextStyle,
}: {
  config: QrScannerConfig
  onManualEntry: (value: string) => void
  sharedTextStyle: TextStyle
}) {
  const tokens = useTokens()
  const [manualValue, setManualValue] = useState('')
  const testId = config.testID ?? config.id ?? 'qr-scanner'

  const fallbackSurface = resolveSlotSurface(config, tokens, 'fallback', {
    padding: 'xl',
    alignItems: 'center',
    backgroundColor: tokens.colors.surface,
    borderRadius: 'lg',
    border: '1 border',
  })
  const iconSurface = resolveSlotSurface(config, tokens, 'icon', {
    color: 'muted',
    fontSize: 'lg',
    fontWeight: 'bold',
    marginBottom: 'md',
  })
  const titleSurface = resolveSlotSurface(config, tokens, 'title', {
    color: 'foreground',
    fontSize: 'lg',
    fontWeight: 'semibold',
    marginBottom: 'sm',
  })
  const messageSurface = resolveSlotSurface(config, tokens, 'message', {
    color: 'muted',
    fontSize: 'sm',
    marginBottom: 'xs',
  })
  const installCommandSurface = resolveSlotSurface(config, tokens, 'installCommand', {
    color: 'primary',
    fontSize: 'xs',
    backgroundColor: tokens.colors.surfaceAlt,
    paddingX: 'md',
    paddingY: 'xs',
    borderRadius: 'sm',
    marginBottom: 'lg',
  })
  const dividerRowSurface = resolveSlotSurface(config, tokens, 'dividerRow', {
    flexDirection: 'row',
    alignItems: 'center',
    width: '100%',
    marginBottom: 'lg',
  })
  const dividerLineSurface = resolveSlotSurface(config, tokens, 'dividerLine', {
    flex: 1,
    height: 1,
    backgroundColor: tokens.colors.divider,
  })
  const dividerTextSurface = resolveSlotSurface(config, tokens, 'dividerText', {
    color: 'muted',
    fontSize: 'xs',
    marginX: 'md',
  })
  const inputSurface = resolveSlotSurface(config, tokens, 'input', {
    width: '100%',
    border: '1 border',
    backgroundColor: tokens.colors.inputBackground,
    borderRadius: 'md',
    paddingX: 'md',
    paddingY: 'md',
    marginBottom: 'md',
    color: tokens.colors.inputText,
  })
  const submitButtonSurface = resolveSlotSurface(config, tokens, 'submitButton', {
    backgroundColor: tokens.colors.primary,
    width: '100%',
    alignItems: 'center',
    paddingX: 'lg',
    paddingY: 'md',
    borderRadius: 'md',
    opacity: manualValue.trim().length === 0 ? 0.5 : 1,
  })
  const submitTextSurface = resolveSlotSurface(config, tokens, 'submitText', {
    color: 'primary-foreground',
    fontSize: 'base',
    fontWeight: 'semibold',
  })

  const handleSubmit = useCallback(() => {
    const value = manualValue.trim()
    if (value.length === 0) {
      return
    }

    onManualEntry(value)
    setManualValue('')
  }, [manualValue, onManualEntry])

  return (
    <View style={fallbackSurface.style as ViewStyle | undefined}>
      <Text style={mergeTextStyle(sharedTextStyle, iconSurface)}>QR</Text>
      <Text style={mergeTextStyle(sharedTextStyle, titleSurface)}>
        Camera Not Available
      </Text>
      <Text style={mergeTextStyle(sharedTextStyle, messageSurface)}>
        Install expo-camera for QR scanning
      </Text>
      <Text style={mergeTextStyle(sharedTextStyle, installCommandSurface)}>
        npx expo install expo-camera
      </Text>

      <View style={dividerRowSurface.style as ViewStyle | undefined}>
        <View style={dividerLineSurface.style as ViewStyle | undefined} />
        <Text style={mergeTextStyle(sharedTextStyle, dividerTextSurface)}>
          or enter manually
        </Text>
        <View style={dividerLineSurface.style as ViewStyle | undefined} />
      </View>

      <TextInput
        style={inputSurface.style as TextStyle | undefined}
        value={manualValue}
        onChangeText={setManualValue}
        placeholder="Enter code value..."
        placeholderTextColor={tokens.colors.inputPlaceholder}
        returnKeyType="done"
        onSubmitEditing={handleSubmit}
        accessibilityLabel="Manual QR code entry"
        accessibilityHint="Type a value and submit to simulate a QR scan"
        testID={`${testId}-manual-input`}
      />

      <TouchableOpacity
        onPress={handleSubmit}
        style={submitButtonSurface.style as ViewStyle | undefined}
        disabled={manualValue.trim().length === 0}
        accessibilityRole="button"
        accessibilityLabel="Submit manual entry"
        testID={`${testId}-manual-submit`}
        activeOpacity={0.7}
      >
        <Text style={mergeTextStyle(sharedTextStyle, submitTextSurface)}>Submit</Text>
      </TouchableOpacity>
    </View>
  )
}

function CameraScannerView({
  config,
  testId,
  onBarcodeScan,
  overlayText,
  sharedTextStyle,
}: {
  config: QrScannerConfig
  testId: string
  onBarcodeScan: (result: BarcodeScanningResult) => void
  overlayText?: string
  sharedTextStyle: TextStyle
}) {
  const tokens = useTokens()
  const [permission, requestPermission] = useCameraPermissions!()

  const permissionContainerSurface = resolveSlotSurface(config, tokens, 'permissionContainer', {
    padding: 'xl',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: tokens.colors.surface,
    borderRadius: 'lg',
    border: '1 border',
  })
  const permissionTextSurface = resolveSlotSurface(config, tokens, 'permissionText', {
    color: 'foreground',
    fontSize: 'base',
    textAlign: 'center',
    marginBottom: 'lg',
  })
  const permissionButtonSurface = resolveSlotSurface(config, tokens, 'permissionButton', {
    backgroundColor: tokens.colors.primary,
    paddingX: 'xl',
    paddingY: 'md',
    borderRadius: 'md',
  })
  const permissionButtonTextSurface = resolveSlotSurface(config, tokens, 'permissionButtonText', {
    color: 'primary-foreground',
    fontSize: 'base',
    fontWeight: 'semibold',
  })
  const cameraContainerSurface = resolveSlotSurface(config, tokens, 'cameraContainer', {
    width: '100%',
    aspectRatio: 3 / 4,
    borderRadius: 'lg',
    overflow: 'hidden',
  })
  const cameraSurface = resolveSlotSurface(config, tokens, 'camera', {
    flex: 1,
  })

  if (permission == null) {
    return (
      <ComponentWrapper id={config.id} testID={config.testID} config={config}>
        <View style={permissionContainerSurface.style as ViewStyle | undefined}>
          <Text style={mergeTextStyle(sharedTextStyle, permissionTextSurface)}>
            Initializing camera...
          </Text>
        </View>
      </ComponentWrapper>
    )
  }

  if (!permission.granted) {
    return (
      <ComponentWrapper id={config.id} testID={config.testID} config={config}>
        <View style={permissionContainerSurface.style as ViewStyle | undefined}>
          <Text style={mergeTextStyle(sharedTextStyle, permissionTextSurface)}>
            Camera permission is required to scan QR codes
          </Text>
          <TouchableOpacity
            onPress={() => void requestPermission()}
            style={permissionButtonSurface.style as ViewStyle | undefined}
            accessibilityRole="button"
            accessibilityLabel="Grant camera permission"
            testID={`${testId}-grant-permission`}
            activeOpacity={0.7}
          >
            <Text style={mergeTextStyle(sharedTextStyle, permissionButtonTextSurface)}>
              Grant Permission
            </Text>
          </TouchableOpacity>
        </View>
      </ComponentWrapper>
    )
  }

  return (
    <ComponentWrapper id={config.id} testID={config.testID} config={config}>
      <View style={cameraContainerSurface.style as ViewStyle | undefined} testID={testId}>
        {React.createElement(
          CameraView!,
          {
            style: cameraSurface.style,
            facing: 'back' as const,
            enableTorch: config.torchEnabled ?? false,
            barcodeScannerSettings: { barcodeTypes: ['qr'] },
            onBarcodeScanned: onBarcodeScan,
          },
          (config.showOverlay ?? true) ? (
            <ScanOverlay
              config={config}
              overlayText={overlayText}
              sharedTextStyle={sharedTextStyle}
            />
          ) : null,
        )}
      </View>
    </ComponentWrapper>
  )
}

export function QrScanner({ config }: { config: QrScannerConfig }) {
  const tokens = useTokens()
  const { dispatch, values } = useScreenContext()
  const [hasScanned, setHasScanned] = useState(false)

  const sharedTextStyle = resolveNativeTextStyle(config as Record<string, unknown>, tokens)
  const overlayText =
    config.overlayText != null
      ? String(resolveFromRef(config.overlayText, values) ?? '')
      : undefined
  const testId = config.testID ?? config.id ?? 'qr-scanner'

  const handleScan = useCallback(
    (value: string) => {
      if (hasScanned) {
        return
      }

      setHasScanned(true)

      if (config.id != null) {
        void dispatch({ type: 'set-value', target: config.id, value })
      }

      void dispatch(config.onScan)
      setTimeout(() => setHasScanned(false), 2000)
    },
    [config.id, config.onScan, dispatch, hasScanned],
  )

  const handleBarcodeScan = useCallback(
    (result: BarcodeScanningResult) => {
      handleScan(result.data)
    },
    [handleScan],
  )

  if (CameraView != null && useCameraPermissions != null) {
    return (
      <CameraScannerView
        config={config}
        testId={testId}
        onBarcodeScan={handleBarcodeScan}
        overlayText={overlayText}
        sharedTextStyle={sharedTextStyle}
      />
    )
  }

  return (
    <ComponentWrapper id={config.id} testID={config.testID} config={config}>
      <FallbackScanner
        config={config}
        onManualEntry={handleScan}
        sharedTextStyle={sharedTextStyle}
      />
    </ComponentWrapper>
  )
}
