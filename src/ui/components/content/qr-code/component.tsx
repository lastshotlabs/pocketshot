import React, { useMemo } from 'react'
import { View, Text, Image, StyleSheet } from 'react-native'
import { ComponentWrapper } from '../../_base/ComponentWrapper'
import { useTokens } from '../../../context/AppContext'
import { useScreenContext } from '../../../context/ScreenContext'
import { resolveFromRef } from '../../_base/fromRef'
import type { DesignTokens } from '../../../tokens/types'
import type { QrCodeConfig } from './types'

// ── Duck-type react-native-qrcode-svg ──────────────────────────────────────────

interface QrCodeSvgProps {
  value: string
  size: number
  color?: string
  backgroundColor?: string
  logo?: { uri: string }
  logoSize?: number
  logoBorderRadius?: number
  logoBackgroundColor?: string
  ecl?: 'L' | 'M' | 'Q' | 'H'
}

type QrCodeSvgComponent = React.ComponentType<QrCodeSvgProps>

let QrCodeSvg: QrCodeSvgComponent | null = null
try {
  // eslint-disable-next-line @typescript-eslint/no-var-requires
  const mod = require('react-native-qrcode-svg') as { default: QrCodeSvgComponent }
  QrCodeSvg = mod.default
} catch {
  // not installed — fallback rendering
}

// ── Fallback: simple hash-based dot matrix ─────────────────────────────────────

function simpleHash(str: string): number {
  let hash = 0
  for (let i = 0; i < str.length; i++) {
    const ch = str.charCodeAt(i)
    hash = ((hash << 5) - hash + ch) | 0
  }
  return hash
}

function generateDotMatrix(value: string, gridSize: number): boolean[][] {
  const matrix: boolean[][] = []
  let seed = Math.abs(simpleHash(value))
  for (let row = 0; row < gridSize; row++) {
    const rowData: boolean[] = []
    for (let col = 0; col < gridSize; col++) {
      // Deterministic pseudo-random based on value
      seed = (seed * 1103515245 + 12345) & 0x7fffffff
      const isFinder =
        (row < 7 && col < 7) ||
        (row < 7 && col >= gridSize - 7) ||
        (row >= gridSize - 7 && col < 7)
      if (isFinder) {
        // Simulate QR finder patterns
        const inBorder =
          row === 0 ||
          col === 0 ||
          row === 6 ||
          col === 6 ||
          row === gridSize - 1 ||
          col === gridSize - 1 ||
          row === gridSize - 7 ||
          col === gridSize - 7
        const inCenter =
          (row >= 2 && row <= 4 && col >= 2 && col <= 4) ||
          (row >= 2 && row <= 4 && col >= gridSize - 5 && col <= gridSize - 3) ||
          (row >= gridSize - 5 && row <= gridSize - 3 && col >= 2 && col <= 4)
        rowData.push(inBorder || inCenter)
      } else {
        rowData.push(seed % 3 !== 0)
      }
    }
    matrix.push(rowData)
  }
  return matrix
}

function FallbackQrCode({
  value,
  size,
  color,
  bgColor,
  tokens,
}: {
  value: string
  size: number
  color: string
  bgColor: string
  tokens: DesignTokens
}) {
  const gridSize = 21
  const dotSize = Math.floor(size / gridSize)
  const matrix = useMemo(() => generateDotMatrix(value, gridSize), [value])

  return (
    <View accessibilityRole="image" accessibilityLabel={`QR code for: ${value}`}>
      <View style={{ width: size, height: size, backgroundColor: bgColor, overflow: 'hidden' }}>
        {matrix.map((row, rowIdx) => (
          <View key={rowIdx} style={{ flexDirection: 'row' }}>
            {row.map((filled, colIdx) => (
              <View
                key={colIdx}
                style={{
                  width: dotSize,
                  height: dotSize,
                  backgroundColor: filled ? color : bgColor,
                }}
              />
            ))}
          </View>
        ))}
      </View>
      <Text
        style={{
          fontSize: tokens.typography.fontSizeXs,
          color: tokens.colors.textMuted,
          textAlign: 'center',
          marginTop: tokens.spacing[2],
        }}
      >
        Install react-native-qrcode-svg for scannable QR codes
      </Text>
    </View>
  )
}

// ── Component ──────────────────────────────────────────────────────────────────

export function QrCode({ config }: { config: QrCodeConfig }) {
  const tokens = useTokens()
  const { values } = useScreenContext()

  const value = resolveFromRef(config.value, values) as string
  const size = config.size ?? 200
  const color = config.color ?? tokens.colors.text
  const bgColor = config.backgroundColor ?? tokens.colors.surface
  const styles = useMemo(() => makeStyles(tokens, bgColor), [tokens, bgColor])

  const testId = config.testID ?? config.id ?? 'qr-code'

  return (
    <ComponentWrapper id={config.id} testID={config.testID}>
      <View
        style={styles.container}
        testID={testId}
        accessibilityRole="image"
        accessibilityLabel={`QR code containing: ${value ?? ''}`}
      >
        {QrCodeSvg != null && value != null ? (
          <View style={styles.qrWrapper}>
            <QrCodeSvg
              value={value}
              size={size}
              color={color}
              backgroundColor={bgColor}
              logo={config.logo != null ? { uri: config.logo } : undefined}
              logoSize={config.logo != null ? size * 0.2 : undefined}
              logoBorderRadius={config.logo != null ? 4 : undefined}
              logoBackgroundColor={bgColor}
              ecl={config.errorCorrectionLevel ?? 'M'}
            />
            {config.logo != null && (
              <View style={styles.logoOverlay} pointerEvents="none">
                <Image
                  source={{ uri: config.logo }}
                  style={styles.logoImage}
                  resizeMode="contain"
                  accessibilityLabel="QR code logo"
                />
              </View>
            )}
          </View>
        ) : value != null ? (
          <FallbackQrCode
            value={value}
            size={size}
            color={color}
            bgColor={bgColor}
            tokens={tokens}
          />
        ) : null}
      </View>
    </ComponentWrapper>
  )
}

function makeStyles(tokens: DesignTokens, bgColor: string) {
  return StyleSheet.create({
    container: {
      alignItems: 'center',
      padding: tokens.spacing[4],
      backgroundColor: bgColor,
      borderRadius: tokens.radius.lg,
      borderWidth: 1,
      borderColor: tokens.colors.border,
    },
    qrWrapper: {
      position: 'relative',
      alignItems: 'center',
      justifyContent: 'center',
    },
    logoOverlay: {
      position: 'absolute',
      alignItems: 'center',
      justifyContent: 'center',
    },
    logoImage: {
      width: 40,
      height: 40,
      borderRadius: 4,
    },
  })
}
