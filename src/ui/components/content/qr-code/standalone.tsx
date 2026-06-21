import React, { useMemo } from 'react'
import { View, Text, type TextStyle, type ViewStyle } from 'react-native'
import { resolveNativeTextStyle } from '../../_base/text-style'
import { resolveSurfacePresentation } from '../../_base/style-surfaces'
import { useTokens } from '../../../context/AppContext'
import type { DesignTokens } from '../../../tokens/types'

function simpleHash(text: string): number {
  let hash = 0
  for (let index = 0; index < text.length; index += 1) {
    const char = text.charCodeAt(index)
    hash = ((hash << 5) - hash + char) | 0
  }
  return hash
}

function generateDotMatrix(value: string, gridSize: number): boolean[][] {
  const matrix: boolean[][] = []
  let seed = Math.abs(simpleHash(value))
  for (let row = 0; row < gridSize; row += 1) {
    const rowData: boolean[] = []
    for (let column = 0; column < gridSize; column += 1) {
      seed = (seed * 1103515245 + 12345) & 0x7fffffff
      const isFinder =
        (row < 7 && column < 7) ||
        (row < 7 && column >= gridSize - 7) ||
        (row >= gridSize - 7 && column < 7)
      if (isFinder) {
        const inBorder =
          row === 0 ||
          column === 0 ||
          row === 6 ||
          column === 6 ||
          row === gridSize - 1 ||
          column === gridSize - 1 ||
          row === gridSize - 7 ||
          column === gridSize - 7
        const inCenter =
          (row >= 2 && row <= 4 && column >= 2 && column <= 4) ||
          (row >= 2 && row <= 4 && column >= gridSize - 5 && column <= gridSize - 3) ||
          (row >= gridSize - 5 && row <= gridSize - 3 && column >= 2 && column <= 4)
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
  slots,
  value,
  size,
  color,
  bgColor,
  sharedTextStyle,
}: {
  slots: Record<string, Record<string, unknown>> | undefined
  value: string
  size: number
  color: string
  bgColor: string
  sharedTextStyle: TextStyle
}) {
  const tokens = useTokens()
  const gridSize = 21
  const dotSize = Math.floor(size / gridSize)
  const matrix = useMemo(() => generateDotMatrix(value, gridSize), [value])

  const matrixSurface = resolveSurfacePresentation({
    tokens,
    implementationBase: {
      width: size,
      height: size,
      bg: bgColor,
      overflow: 'hidden',
    },
    componentSurface: slots?.matrix,
  })
  const captionSurface = resolveSurfacePresentation({
    tokens,
    implementationBase: {
      fontSize: 'xs',
      color: 'muted',
      textAlign: 'center',
      marginTop: 'sm',
    },
    componentSurface: slots?.caption,
  })

  return (
    <View accessibilityRole="image" accessibilityLabel={`QR code for: ${value}`}>
      <View style={matrixSurface.style as ViewStyle | undefined}>
        {matrix.map((row, rowIndex) => (
          <View key={rowIndex} style={{ flexDirection: 'row' }}>
            {row.map((filled, columnIndex) => (
              <View
                key={columnIndex}
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
          ...sharedTextStyle,
          ...(captionSurface.style as TextStyle | undefined),
        }}
      >
        Install react-native-qrcode-svg for scannable QR codes
      </Text>
    </View>
  )
}

export interface QrCodeBaseProps {
  /** Value to encode. */
  value: string
  /** Pixel size of the QR matrix. */
  size?: number
  /** Foreground (dot) color. */
  color?: string
  /** Background color. */
  bg?: string
  /** Style applied to the root container. */
  style?: ViewStyle
  /** Slot overrides keyed by slot name. */
  slots?: Record<string, Record<string, unknown>>
  testID?: string
  id?: string
}

/**
 * Standalone QrCode — plain React props, no manifest required.
 *
 * @example
 * <QrCodeBase value="https://example.com" size={220} />
 */
export function QrCodeBase({
  value,
  size = 200,
  color,
  bg,
  style,
  slots,
  testID,
  id,
}: QrCodeBaseProps) {
  const tokens = useTokens()
  const sharedTextStyle = resolveNativeTextStyle({}, tokens)

  const resolvedColor = color ?? tokens.colors.text
  const resolvedBg = bg ?? tokens.colors.surface

  const containerSurface = resolveSurfacePresentation({
    tokens,
    implementationBase: {
      alignItems: 'center',
      padding: 'lg',
      bg: resolvedBg,
      borderRadius: 'lg',
      border: '1px solid border',
    },
    componentSurface: slots?.container,
  })
  const testId = testID ?? id ?? 'qr-code'

  return (
    <View
      style={[containerSurface.style as ViewStyle | undefined, style]}
      testID={testId}
      accessibilityRole="image"
      accessibilityLabel={`QR code containing: ${value ?? ''}`}
    >
      {value != null ? (
        <FallbackQrCode
          slots={slots}
          value={value}
          size={size}
          color={resolvedColor}
          bgColor={resolvedBg}
          sharedTextStyle={sharedTextStyle}
        />
      ) : null}
    </View>
  )
}
