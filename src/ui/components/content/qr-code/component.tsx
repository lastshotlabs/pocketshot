import React, { useMemo } from 'react'
import { View, Text, type TextStyle, type ViewStyle } from 'react-native'
import { ComponentWrapper } from '../../_base/ComponentWrapper'
import { resolveNativeStyleProps, resolveNativeTextStyle, resolveSurfacePresentation } from '../../_base'
import { useTokens } from '../../../context/AppContext'
import { useScreenContext } from '../../../context/ScreenContext'
import { resolveFromRef } from '../../_base/fromRef'
import type { QrCodeConfig } from './types'

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
  config,
  value,
  size,
  color,
  bgColor,
}: {
  config: QrCodeConfig
  value: string
  size: number
  color: string
  bgColor: string
}) {
  const tokens = useTokens()
  const sharedTextStyle = resolveNativeTextStyle(config as Record<string, unknown>, tokens)
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
    componentSurface: config.slots?.matrix as Record<string, unknown> | undefined,
  })
  const captionSurface = resolveSurfacePresentation({
    tokens,
    implementationBase: {
      fontSize: 'xs',
      color: 'muted',
      textAlign: 'center',
      marginTop: 'sm',
    },
    componentSurface: config.slots?.caption as Record<string, unknown> | undefined,
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

export function QrCode({ config }: { config: QrCodeConfig }) {
  const tokens = useTokens()
  const { values } = useScreenContext()

  const value = resolveFromRef(config.value, values) as string
  const size = config.size ?? 200
  const resolvedStyle = resolveNativeStyleProps(
    {
      color: config.color,
      bg: config.bg,
    },
    tokens,
  )
  const color = typeof resolvedStyle.color === 'string' ? resolvedStyle.color : tokens.colors.text
  const bgColor =
    typeof resolvedStyle.backgroundColor === 'string' ? resolvedStyle.backgroundColor : tokens.colors.surface
  const containerSurface = resolveSurfacePresentation({
    tokens,
    implementationBase: {
      alignItems: 'center',
      padding: 'lg',
      bg: bgColor,
      borderRadius: 'lg',
      border: '1px solid border',
    },
    componentSurface: config.slots?.container as Record<string, unknown> | undefined,
  })
  const testId = config.testID ?? config.id ?? 'qr-code'

  return (
    <ComponentWrapper id={config.id} testID={config.testID} config={config}>
      <View
        style={containerSurface.style as ViewStyle | undefined}
        testID={testId}
        accessibilityRole="image"
        accessibilityLabel={`QR code containing: ${value ?? ''}`}
      >
        {value != null ? (
          <FallbackQrCode config={config} value={value} size={size} color={color} bgColor={bgColor} />
        ) : null}
      </View>
    </ComponentWrapper>
  )
}
