import React, { useCallback, useEffect, useRef, useState } from 'react'
import {
  Animated,
  Text,
  TextInput,
  TouchableOpacity,
  View,
  type TextStyle,
  type ViewStyle,
} from 'react-native'
import { resolveNativeTextStyle } from '../../_base/text-style'
import { resolveSurfacePresentation } from '../../_base/style-surfaces'
import { useTokens } from '../../../context/AppContext'
import type { DesignTokens } from '../../../tokens/types'

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

function resolveSlot(
  slots: Record<string, Record<string, unknown> | undefined> | undefined,
  tokens: DesignTokens,
  slot: string,
  implementationBase?: Record<string, unknown>,
) {
  return resolveSurfacePresentation({
    tokens,
    implementationBase,
    componentSurface: slots?.[slot],
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
  slots,
  overlayText,
  sharedTextStyle,
}: {
  slots: Record<string, Record<string, unknown>> | undefined
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

  const overlayContainerSurface = resolveSlot(slots, tokens, 'overlayContainer', {
    position: 'absolute',
    inset: 0,
  })
  const topOverlaySurface = resolveSlot(slots, tokens, 'topOverlay', {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
  })
  const middleRowSurface = resolveSlot(slots, tokens, 'middleRow', {
    flexDirection: 'row',
    height: SCAN_AREA_SIZE,
  })
  const sideOverlaySurface = resolveSlot(slots, tokens, 'sideOverlay', {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
  })
  const scanAreaSurface = resolveSlot(slots, tokens, 'scanArea', {
    width: SCAN_AREA_SIZE,
    height: SCAN_AREA_SIZE,
    overflow: 'hidden',
  })
  const cornerSurface = resolveSlot(slots, tokens, 'corner', {
    width: 24,
    height: 24,
    borderColor: tokens.colors.primary,
    borderWidth: 3,
    position: 'absolute',
  })
  const scanLineSurface = resolveSlot(slots, tokens, 'scanLine', {
    width: SCAN_AREA_SIZE,
    height: 2,
    backgroundColor: tokens.colors.primary,
  })
  const bottomOverlaySurface = resolveSlot(slots, tokens, 'bottomOverlay', {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    alignItems: 'center',
    paddingTop: 'lg',
  })
  const overlayTextSurface = resolveSlot(slots, tokens, 'overlayText', {
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
  slots,
  testId,
  onManualEntry,
  sharedTextStyle,
}: {
  slots: Record<string, Record<string, unknown>> | undefined
  testId: string
  onManualEntry: (value: string) => void
  sharedTextStyle: TextStyle
}) {
  const tokens = useTokens()
  const [manualValue, setManualValue] = useState('')

  const fallbackSurface = resolveSlot(slots, tokens, 'fallback', {
    padding: 'xl',
    alignItems: 'center',
    backgroundColor: tokens.colors.surface,
    borderRadius: 'lg',
    border: '1 border',
  })
  const iconSurface = resolveSlot(slots, tokens, 'icon', {
    color: 'muted',
    fontSize: 'lg',
    fontWeight: 'bold',
    marginBottom: 'md',
  })
  const titleSurface = resolveSlot(slots, tokens, 'title', {
    color: 'foreground',
    fontSize: 'lg',
    fontWeight: 'semibold',
    marginBottom: 'sm',
  })
  const messageSurface = resolveSlot(slots, tokens, 'message', {
    color: 'muted',
    fontSize: 'sm',
    marginBottom: 'xs',
  })
  const installCommandSurface = resolveSlot(slots, tokens, 'installCommand', {
    color: 'primary',
    fontSize: 'xs',
    backgroundColor: tokens.colors.surfaceAlt,
    paddingX: 'md',
    paddingY: 'xs',
    borderRadius: 'sm',
    marginBottom: 'lg',
  })
  const dividerRowSurface = resolveSlot(slots, tokens, 'dividerRow', {
    flexDirection: 'row',
    alignItems: 'center',
    width: '100%',
    marginBottom: 'lg',
  })
  const dividerLineSurface = resolveSlot(slots, tokens, 'dividerLine', {
    flex: 1,
    height: 1,
    backgroundColor: tokens.colors.divider,
  })
  const dividerTextSurface = resolveSlot(slots, tokens, 'dividerText', {
    color: 'muted',
    fontSize: 'xs',
    marginX: 'md',
  })
  const inputSurface = resolveSlot(slots, tokens, 'input', {
    width: '100%',
    border: '1 border',
    backgroundColor: tokens.colors.inputBackground,
    borderRadius: 'md',
    paddingX: 'md',
    paddingY: 'md',
    marginBottom: 'md',
    color: tokens.colors.inputText,
  })
  const submitButtonSurface = resolveSlot(slots, tokens, 'submitButton', {
    backgroundColor: tokens.colors.primary,
    width: '100%',
    alignItems: 'center',
    paddingX: 'lg',
    paddingY: 'md',
    borderRadius: 'md',
    opacity: manualValue.trim().length === 0 ? 0.5 : 1,
  })
  const submitTextSurface = resolveSlot(slots, tokens, 'submitText', {
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
      <Text style={mergeTextStyle(sharedTextStyle, titleSurface)}>Camera Not Available</Text>
      <Text style={mergeTextStyle(sharedTextStyle, messageSurface)}>
        Install expo-camera for QR scanning
      </Text>
      <Text style={mergeTextStyle(sharedTextStyle, installCommandSurface)}>
        npx expo install expo-camera
      </Text>

      <View style={dividerRowSurface.style as ViewStyle | undefined}>
        <View style={dividerLineSurface.style as ViewStyle | undefined} />
        <Text style={mergeTextStyle(sharedTextStyle, dividerTextSurface)}>or enter manually</Text>
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
  slots,
  testId,
  onBarcodeScan,
  overlayText,
  sharedTextStyle,
  torchEnabled,
  showOverlay,
  containerStyle,
}: {
  slots: Record<string, Record<string, unknown>> | undefined
  testId: string
  onBarcodeScan: (result: BarcodeScanningResult) => void
  overlayText?: string
  sharedTextStyle: TextStyle
  torchEnabled: boolean
  showOverlay: boolean
  containerStyle?: ViewStyle
}) {
  const tokens = useTokens()
  const [permission, requestPermission] = useCameraPermissions!()

  const permissionContainerSurface = resolveSlot(slots, tokens, 'permissionContainer', {
    padding: 'xl',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: tokens.colors.surface,
    borderRadius: 'lg',
    border: '1 border',
  })
  const permissionTextSurface = resolveSlot(slots, tokens, 'permissionText', {
    color: 'foreground',
    fontSize: 'base',
    textAlign: 'center',
    marginBottom: 'lg',
  })
  const permissionButtonSurface = resolveSlot(slots, tokens, 'permissionButton', {
    backgroundColor: tokens.colors.primary,
    paddingX: 'xl',
    paddingY: 'md',
    borderRadius: 'md',
  })
  const permissionButtonTextSurface = resolveSlot(slots, tokens, 'permissionButtonText', {
    color: 'primary-foreground',
    fontSize: 'base',
    fontWeight: 'semibold',
  })
  const cameraContainerSurface = resolveSlot(slots, tokens, 'cameraContainer', {
    width: '100%',
    aspectRatio: 3 / 4,
    borderRadius: 'lg',
    overflow: 'hidden',
  })
  const cameraSurface = resolveSlot(slots, tokens, 'camera', {
    flex: 1,
  })

  if (permission == null) {
    return (
      <View style={[permissionContainerSurface.style as ViewStyle | undefined, containerStyle]}>
        <Text style={mergeTextStyle(sharedTextStyle, permissionTextSurface)}>
          Initializing camera...
        </Text>
      </View>
    )
  }

  if (!permission.granted) {
    return (
      <View style={[permissionContainerSurface.style as ViewStyle | undefined, containerStyle]}>
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
    )
  }

  return (
    <View
      style={[cameraContainerSurface.style as ViewStyle | undefined, containerStyle]}
      testID={testId}
    >
      {React.createElement(
        CameraView!,
        {
          style: cameraSurface.style,
          facing: 'back' as const,
          enableTorch: torchEnabled,
          barcodeScannerSettings: { barcodeTypes: ['qr'] },
          onBarcodeScanned: onBarcodeScan,
        },
        showOverlay ? (
          <ScanOverlay slots={slots} overlayText={overlayText} sharedTextStyle={sharedTextStyle} />
        ) : null,
      )}
    </View>
  )
}

export interface QrScannerBaseProps {
  /** Called when a QR code is scanned (or submitted via the fallback). */
  onScan: (value: string) => void
  /** Enable the camera flashlight. */
  torchEnabled?: boolean
  /** Show the scan-area overlay (default true). */
  showOverlay?: boolean
  /** Optional text rendered below the scan area. */
  overlayText?: string
  /** Style applied to the camera container or fallback container. */
  style?: ViewStyle
  /** Slot overrides keyed by slot name. */
  slots?: Record<string, Record<string, unknown>>
  testID?: string
  id?: string
}

/**
 * Standalone QrScanner — plain React props, no manifest required.
 *
 * @example
 * <QrScannerBase onScan={(value) => console.log('scanned', value)} />
 */
export function QrScannerBase({
  onScan,
  torchEnabled = false,
  showOverlay = true,
  overlayText,
  style,
  slots,
  testID,
  id,
}: QrScannerBaseProps) {
  const tokens = useTokens()
  const sharedTextStyle = resolveNativeTextStyle({}, tokens)
  const [hasScanned, setHasScanned] = useState(false)
  const testId = testID ?? id ?? 'qr-scanner'

  const handleScan = useCallback(
    (value: string) => {
      if (hasScanned) {
        return
      }

      setHasScanned(true)
      onScan(value)
      setTimeout(() => setHasScanned(false), 2000)
    },
    [hasScanned, onScan],
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
        slots={slots}
        testId={testId}
        onBarcodeScan={handleBarcodeScan}
        overlayText={overlayText}
        sharedTextStyle={sharedTextStyle}
        torchEnabled={torchEnabled}
        showOverlay={showOverlay}
        containerStyle={style}
      />
    )
  }

  return (
    <View style={style}>
      <FallbackScanner
        slots={slots}
        testId={testId}
        onManualEntry={handleScan}
        sharedTextStyle={sharedTextStyle}
      />
    </View>
  )
}
