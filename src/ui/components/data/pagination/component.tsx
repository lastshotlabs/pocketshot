import React, { useCallback, useEffect, useMemo, useState } from 'react'
import { View, Text, TouchableOpacity, type TextStyle, type ViewStyle } from 'react-native'
import { ComponentWrapper } from '../../_base/ComponentWrapper'
import { resolveNativeTextStyle, resolveSurfacePresentation, isFromRef, resolveFromRef } from '../../_base'
import type { RuntimeSurfaceState } from '../../_base'
import { useTokens } from '../../../context/AppContext'
import { useScreenContext } from '../../../context/ScreenContext'
import type { PaginationConfig } from './types'

export function Pagination({ config }: { config: PaginationConfig }) {
  const tokens = useTokens()
  const { setValue, dispatch, values } = useScreenContext()
  const sharedTextStyle = resolveNativeTextStyle(config as Record<string, unknown>, tokens)

  const resolvedCurrentPage = useMemo(() => {
    if (isFromRef(config.currentPage)) {
      const resolved = resolveFromRef(config.currentPage, values)
      return typeof resolved === 'number' ? resolved : undefined
    }
    return typeof config.currentPage === 'number' ? config.currentPage : undefined
  }, [config.currentPage, values])

  const [internalPage, setInternalPage] = useState(resolvedCurrentPage ?? 1)

  useEffect(() => {
    if (resolvedCurrentPage !== undefined) {
      setInternalPage(resolvedCurrentPage)
    }
  }, [resolvedCurrentPage])

  const currentPage = resolvedCurrentPage ?? internalPage
  const totalPages = config.totalPages ?? 1
  const baseTestID = config.testID ?? config.id

  const containerSurface = resolveSurfacePresentation({
    tokens,
    implementationBase: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      paddingY: 'md',
      gap: 'sm',
    },
    componentSurface: config.slots?.container as Record<string, unknown> | undefined,
  })
  const navButtonSurface = resolveSurfacePresentation({
    tokens,
    implementationBase: {
      paddingX: 'md',
      paddingY: 'sm',
      borderRadius: 'md',
      border: '1px solid border',
      bg: 'card',
      states: {
        disabled: {
          opacity: 0.4,
        },
      },
    },
    componentSurface: config.slots?.navButton as Record<string, unknown> | undefined,
  })
  const pageIndicatorSurface = resolveSurfacePresentation({
    tokens,
    implementationBase: {
      paddingX: 'md',
    },
    componentSurface: config.slots?.pageIndicator as Record<string, unknown> | undefined,
  })
  const pageTextSurface = resolveSurfacePresentation({
    tokens,
    implementationBase: {
      fontSize: 'sm',
      color: 'muted',
    },
    componentSurface: config.slots?.pageText as Record<string, unknown> | undefined,
  })
  const currentPageSurface = resolveSurfacePresentation({
    tokens,
    implementationBase: {
      fontSize: 'sm',
      fontWeight: 'semibold',
      color: 'foreground',
    },
    componentSurface: config.slots?.currentPage as Record<string, unknown> | undefined,
  })
  const loadMoreButtonSurface = resolveSurfacePresentation({
    tokens,
    implementationBase: {
      paddingX: 'xl',
      paddingY: 'md',
      borderRadius: 'md',
      border: '1px solid border',
      bg: 'popover',
    },
    componentSurface: config.slots?.loadMoreButton as Record<string, unknown> | undefined,
  })
  const loadMoreTextSurface = resolveSurfacePresentation({
    tokens,
    implementationBase: {
      fontSize: 'sm',
      fontWeight: 'medium',
      color: 'primary',
    },
    componentSurface: config.slots?.loadMoreText as Record<string, unknown> | undefined,
  })

  const baseTextStyle: TextStyle = {
    fontSize:
      typeof sharedTextStyle.fontSize === 'number'
        ? sharedTextStyle.fontSize
        : tokens.typography.fontSizeSm,
    fontWeight:
      typeof sharedTextStyle.fontWeight === 'string'
        ? sharedTextStyle.fontWeight
        : undefined,
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

  const goToPage = useCallback(
    async (page: number) => {
      setInternalPage(page)
      if (config.id) {
        setValue(config.id, page)
      }
      if (config.onPageChange) {
        await dispatch(config.onPageChange)
      }
    },
    [config.id, config.onPageChange, dispatch, setValue],
  )

  const handlePrevious = useCallback(async () => {
    if (currentPage > 1) {
      await goToPage(currentPage - 1)
    }
  }, [currentPage, goToPage])

  const handleNext = useCallback(async () => {
    if (currentPage < totalPages) {
      await goToPage(currentPage + 1)
    }
  }, [currentPage, goToPage, totalPages])

  const handleLoadMore = useCallback(async () => {
    if (config.onLoadMore) {
      await dispatch(config.onLoadMore)
    }
  }, [config.onLoadMore, dispatch])

  if (config.mode === 'infinite') {
    return (
      <ComponentWrapper id={config.id} testID={config.testID} config={config}>
        <View />
      </ComponentWrapper>
    )
  }

  if (config.mode === 'load-more') {
    return (
      <ComponentWrapper id={config.id} testID={config.testID} config={config}>
        <View style={containerSurface.style as ViewStyle | undefined}>
          <TouchableOpacity
            onPress={handleLoadMore}
            style={loadMoreButtonSurface.style as ViewStyle | undefined}
            accessibilityRole="button"
            accessibilityLabel="Load more"
            testID={`${baseTestID}-load-more`}
            activeOpacity={0.7}
          >
            <Text
              style={{
                ...baseTextStyle,
                ...(loadMoreTextSurface.style as TextStyle | undefined),
              }}
            >
              Load More
            </Text>
          </TouchableOpacity>
        </View>
      </ComponentWrapper>
    )
  }

  const isFirstPage = currentPage <= 1
  const isLastPage = currentPage >= totalPages

  function renderNavButton(params: {
    label: string
    onPress: () => void | Promise<void>
    disabled: boolean
    testID: string
    accessibilityLabel: string
  }) {
    const activeStates: RuntimeSurfaceState[] | undefined = params.disabled ? ['disabled'] : undefined

    return (
      <TouchableOpacity
        onPress={() => void params.onPress()}
        style={
          resolveSurfacePresentation({
            tokens,
            implementationBase: navButtonSurface.resolvedConfigForWrapper,
            activeStates,
          }).style as ViewStyle | undefined
        }
        disabled={params.disabled}
        accessibilityRole="button"
        accessibilityLabel={params.accessibilityLabel}
        accessibilityState={{ disabled: params.disabled }}
        testID={params.testID}
        activeOpacity={0.7}
      >
        <Text
          style={{
            ...baseTextStyle,
            color: tokens.colors.text,
          }}
        >
          {params.label}
        </Text>
      </TouchableOpacity>
    )
  }

  return (
    <ComponentWrapper id={config.id} testID={config.testID} config={config}>
      <View
        style={containerSurface.style as ViewStyle | undefined}
        accessibilityRole="toolbar"
        accessibilityLabel="Pagination"
      >
        {renderNavButton({
          label: 'Previous',
          onPress: handlePrevious,
          disabled: isFirstPage,
          accessibilityLabel: 'Previous page',
          testID: `${baseTestID}-previous`,
        })}

        <View style={pageIndicatorSurface.style as ViewStyle | undefined}>
          <Text
            style={{
              ...baseTextStyle,
              ...(pageTextSurface.style as TextStyle | undefined),
            }}
          >
            <Text
              style={{
                ...baseTextStyle,
                ...(currentPageSurface.style as TextStyle | undefined),
              }}
            >
              {currentPage}
            </Text>
            {' / '}
            {totalPages}
          </Text>
        </View>

        {renderNavButton({
          label: 'Next',
          onPress: handleNext,
          disabled: isLastPage,
          accessibilityLabel: 'Next page',
          testID: `${baseTestID}-next`,
        })}
      </View>
    </ComponentWrapper>
  )
}
