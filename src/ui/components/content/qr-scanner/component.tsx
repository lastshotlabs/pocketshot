import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { View, Text, TextInput, TouchableOpacity, StyleSheet, Animated } from 'react-native'
import { ComponentWrapper } from '../../_base/ComponentWrapper'
import { useTokens } from '../../../context/AppContext'
import { useScreenContext } from '../../../context/ScreenContext'
import type { DesignTokens } from '../../../tokens/types'
import type { QrScannerConfig } from './types'

// ── Duck-type expo-camera / expo-barcode-scanner ───────────────────────────────

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
  // not installed
}

// ── Scanning overlay with animated line ────────────────────────────────────────

const SCAN_AREA_SIZE = 250

function ScanOverlay({
  tokens,
  overlayText,
}: {
  tokens: DesignTokens
  overlayText?: string
}) {
  const scanLineY = useRef(new Animated.Value(0)).current

  useEffect(() => {
    const anim = Animated.loop(
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
    anim.start()
    return () => anim.stop()
  }, [scanLineY])

  const styles = useMemo(() => makeOverlayStyles(tokens), [tokens])

  return (
    <View style={styles.overlayContainer} pointerEvents="none">
      {/* Semi-transparent areas */}
      <View style={styles.topOverlay} />
      <View style={styles.middleRow}>
        <View style={styles.sideOverlay} />
        <View style={styles.scanArea}>
          {/* Corner markers */}
          <View style={[styles.corner, styles.topLeft]} />
          <View style={[styles.corner, styles.topRight]} />
          <View style={[styles.corner, styles.bottomLeft]} />
          <View style={[styles.corner, styles.bottomRight]} />
          {/* Animated scan line */}
          <Animated.View
            style={[styles.scanLine, { transform: [{ translateY: scanLineY }] }]}
          />
        </View>
        <View style={styles.sideOverlay} />
      </View>
      <View style={styles.bottomOverlay}>
        {overlayText != null && (
          <Text style={styles.overlayText}>{overlayText}</Text>
        )}
      </View>
    </View>
  )
}

// ── Fallback placeholder ───────────────────────────────────────────────────────

function FallbackScanner({
  config,
  tokens,
  onManualEntry,
}: {
  config: QrScannerConfig
  tokens: DesignTokens
  onManualEntry: (value: string) => void
}) {
  const [manualValue, setManualValue] = useState('')
  const styles = useMemo(() => makeFallbackStyles(tokens), [tokens])
  const testId = config.testID ?? config.id ?? 'qr-scanner'

  const handleSubmit = useCallback(() => {
    if (manualValue.trim().length > 0) {
      onManualEntry(manualValue.trim())
      setManualValue('')
    }
  }, [manualValue, onManualEntry])

  return (
    <View style={styles.container}>
      <Text style={styles.icon} accessibilityElementsHidden>
        {'\uD83D\uDCF7'}
      </Text>
      <Text style={styles.title}>Camera Not Available</Text>
      <Text style={styles.message}>
        Install expo-camera for QR scanning
      </Text>
      <Text style={styles.installCmd} selectable>
        npx expo install expo-camera
      </Text>

      <View style={styles.dividerRow}>
        <View style={styles.dividerLine} />
        <Text style={styles.dividerText}>or enter manually</Text>
        <View style={styles.dividerLine} />
      </View>

      <TextInput
        style={styles.input}
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
        style={[
          styles.submitButton,
          manualValue.trim().length === 0 && styles.submitButtonDisabled,
        ]}
        disabled={manualValue.trim().length === 0}
        accessibilityRole="button"
        accessibilityLabel="Submit manual entry"
        testID={`${testId}-manual-submit`}
        activeOpacity={0.7}
      >
        <Text style={styles.submitText}>Submit</Text>
      </TouchableOpacity>
    </View>
  )
}

// ── Component ──────────────────────────────────────────────────────────────────

export function QrScanner({ config }: { config: QrScannerConfig }) {
  const tokens = useTokens()
  const { dispatch } = useScreenContext()
  const [hasScanned, setHasScanned] = useState(false)

  const testId = config.testID ?? config.id ?? 'qr-scanner'

  const handleScan = useCallback(
    (data: string) => {
      if (hasScanned) return
      setHasScanned(true)
      // Store the scanned data in ScreenContext under the component id
      if (config.id != null) {
        void dispatch({ type: 'set-value', key: config.id, value: data })
      }
      void dispatch(config.onScan)
      // Reset after a brief delay to allow re-scanning
      const timer = setTimeout(() => setHasScanned(false), 2000)
      return () => clearTimeout(timer)
    },
    [hasScanned, config.id, config.onScan, dispatch],
  )

  const handleBarcodeScan = useCallback(
    (result: BarcodeScanningResult) => {
      handleScan(result.data)
    },
    [handleScan],
  )

  // Camera-based rendering
  if (CameraView != null && useCameraPermissions != null) {
    return (
      <CameraScannerView
        config={config}
        tokens={tokens}
        testId={testId}
        onBarcodeScan={handleBarcodeScan}
      />
    )
  }

  // Fallback
  return (
    <ComponentWrapper id={config.id} testID={config.testID}>
      <FallbackScanner config={config} tokens={tokens} onManualEntry={handleScan} />
    </ComponentWrapper>
  )
}

// ── Camera scanner (separate component to use hook conditionally) ──────────────

function CameraScannerView({
  config,
  tokens,
  testId,
  onBarcodeScan,
}: {
  config: QrScannerConfig
  tokens: DesignTokens
  testId: string
  onBarcodeScan: (result: BarcodeScanningResult) => void
}) {
  const [permission, requestPermission] = useCameraPermissions!()
  const styles = useMemo(() => makeCameraStyles(tokens), [tokens])

  if (permission == null) {
    return (
      <ComponentWrapper id={config.id} testID={config.testID}>
        <View style={styles.permissionContainer}>
          <Text style={styles.permissionText}>Initializing camera...</Text>
        </View>
      </ComponentWrapper>
    )
  }

  if (!permission.granted) {
    return (
      <ComponentWrapper id={config.id} testID={config.testID}>
        <View style={styles.permissionContainer}>
          <Text style={styles.permissionText}>Camera permission is required to scan QR codes</Text>
          <TouchableOpacity
            onPress={() => void requestPermission()}
            style={styles.permissionButton}
            accessibilityRole="button"
            accessibilityLabel="Grant camera permission"
            testID={`${testId}-grant-permission`}
            activeOpacity={0.7}
          >
            <Text style={styles.permissionButtonText}>Grant Permission</Text>
          </TouchableOpacity>
        </View>
      </ComponentWrapper>
    )
  }

  return (
    <ComponentWrapper id={config.id} testID={config.testID}>
      <View style={styles.cameraContainer} testID={testId}>
        {React.createElement(
          CameraView!,
          {
            style: styles.camera,
            facing: 'back' as const,
            enableTorch: config.torchEnabled ?? false,
            barcodeScannerSettings: { barcodeTypes: ['qr'] },
            onBarcodeScanned: onBarcodeScan,
          },
          (config.showOverlay ?? true) ? (
            <ScanOverlay tokens={tokens} overlayText={config.overlayText} />
          ) : null,
        )}
      </View>
    </ComponentWrapper>
  )
}

// ── Styles ─────────────────────────────────────────────────────────────────────

function makeOverlayStyles(tokens: DesignTokens) {
  const overlayBg = 'rgba(0,0,0,0.5)'
  return StyleSheet.create({
    overlayContainer: {
      ...StyleSheet.absoluteFillObject,
    },
    topOverlay: {
      flex: 1,
      backgroundColor: overlayBg,
    },
    middleRow: {
      flexDirection: 'row',
      height: SCAN_AREA_SIZE,
    },
    sideOverlay: {
      flex: 1,
      backgroundColor: overlayBg,
    },
    scanArea: {
      width: SCAN_AREA_SIZE,
      height: SCAN_AREA_SIZE,
      overflow: 'hidden',
    },
    corner: {
      position: 'absolute',
      width: 24,
      height: 24,
      borderColor: tokens.colors.primary,
      borderWidth: 3,
    },
    topLeft: { top: 0, left: 0, borderRightWidth: 0, borderBottomWidth: 0 },
    topRight: { top: 0, right: 0, borderLeftWidth: 0, borderBottomWidth: 0 },
    bottomLeft: { bottom: 0, left: 0, borderRightWidth: 0, borderTopWidth: 0 },
    bottomRight: { bottom: 0, right: 0, borderLeftWidth: 0, borderTopWidth: 0 },
    scanLine: {
      width: SCAN_AREA_SIZE,
      height: 2,
      backgroundColor: tokens.colors.primary,
    },
    bottomOverlay: {
      flex: 1,
      backgroundColor: overlayBg,
      alignItems: 'center',
      paddingTop: tokens.spacing[4],
    },
    overlayText: {
      color: '#ffffff',
      fontSize: tokens.typography.fontSizeMd,
      fontWeight: tokens.typography.fontWeightMedium,
    },
  })
}

function makeCameraStyles(tokens: DesignTokens) {
  return StyleSheet.create({
    cameraContainer: {
      width: '100%',
      aspectRatio: 3 / 4,
      borderRadius: tokens.radius.lg,
      overflow: 'hidden',
    },
    camera: {
      flex: 1,
    },
    permissionContainer: {
      padding: tokens.spacing[8],
      alignItems: 'center',
      justifyContent: 'center',
      backgroundColor: tokens.colors.surface,
      borderRadius: tokens.radius.lg,
      borderWidth: 1,
      borderColor: tokens.colors.border,
    },
    permissionText: {
      fontSize: tokens.typography.fontSizeMd,
      color: tokens.colors.text,
      textAlign: 'center',
      marginBottom: tokens.spacing[4],
    },
    permissionButton: {
      backgroundColor: tokens.colors.primary,
      paddingHorizontal: tokens.spacing[6],
      paddingVertical: tokens.spacing[3],
      borderRadius: tokens.radius.md,
    },
    permissionButtonText: {
      color: tokens.colors.primaryForeground,
      fontSize: tokens.typography.fontSizeMd,
      fontWeight: tokens.typography.fontWeightSemibold,
    },
  })
}

function makeFallbackStyles(tokens: DesignTokens) {
  return StyleSheet.create({
    container: {
      padding: tokens.spacing[6],
      alignItems: 'center',
      backgroundColor: tokens.colors.surface,
      borderRadius: tokens.radius.lg,
      borderWidth: 1,
      borderColor: tokens.colors.border,
    },
    icon: {
      fontSize: 48,
      marginBottom: tokens.spacing[3],
    },
    title: {
      fontSize: tokens.typography.fontSizeLg,
      fontWeight: tokens.typography.fontWeightSemibold,
      color: tokens.colors.text,
      marginBottom: tokens.spacing[2],
    },
    message: {
      fontSize: tokens.typography.fontSizeSm,
      color: tokens.colors.textMuted,
      marginBottom: tokens.spacing[1],
    },
    installCmd: {
      fontFamily: 'monospace',
      fontSize: tokens.typography.fontSizeXs,
      color: tokens.colors.primary,
      backgroundColor: tokens.colors.surfaceAlt,
      paddingHorizontal: tokens.spacing[3],
      paddingVertical: tokens.spacing[1],
      borderRadius: tokens.radius.sm,
      marginBottom: tokens.spacing[4],
      overflow: 'hidden',
    },
    dividerRow: {
      flexDirection: 'row',
      alignItems: 'center',
      width: '100%',
      marginBottom: tokens.spacing[4],
    },
    dividerLine: {
      flex: 1,
      height: 1,
      backgroundColor: tokens.colors.divider,
    },
    dividerText: {
      fontSize: tokens.typography.fontSizeXs,
      color: tokens.colors.textMuted,
      marginHorizontal: tokens.spacing[3],
    },
    input: {
      width: '100%',
      borderWidth: 1,
      borderColor: tokens.colors.inputBorder,
      backgroundColor: tokens.colors.inputBackground,
      borderRadius: tokens.radius.md,
      paddingHorizontal: tokens.spacing[3],
      paddingVertical: tokens.spacing[3],
      fontSize: tokens.typography.fontSizeMd,
      color: tokens.colors.inputText,
      marginBottom: tokens.spacing[3],
    },
    submitButton: {
      backgroundColor: tokens.colors.primary,
      paddingHorizontal: tokens.spacing[6],
      paddingVertical: tokens.spacing[3],
      borderRadius: tokens.radius.md,
      width: '100%',
      alignItems: 'center',
    },
    submitButtonDisabled: {
      opacity: 0.5,
    },
    submitText: {
      color: tokens.colors.primaryForeground,
      fontSize: tokens.typography.fontSizeMd,
      fontWeight: tokens.typography.fontWeightSemibold,
    },
  })
}
