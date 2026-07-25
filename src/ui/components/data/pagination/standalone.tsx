import React, { useEffect, useState } from 'react'
import { Text, TouchableOpacity, View, type TextStyle, type ViewStyle } from 'react-native'
import { resolveNativeTextStyle } from '../../_base/text-style'
import { resolveSurfacePresentation } from '../../_base/style-surfaces'
import type { RuntimeSurfaceState } from '../../_base/surface-state'
import { useTokens } from '../../../context/AppContext'

export type PaginationMode = 'pages' | 'load-more' | 'infinite'

export interface PaginationBaseProps {
  /** Pagination mode. */
  mode?: PaginationMode
  /** Controlled current page. */
  currentPage?: number
  /** Initial page when uncontrolled. */
  defaultPage?: number
  /** Total number of pages. */
  totalPages?: number
  /** Called when the user navigates pages (pages mode). Receives the new page. */
  onPageChange?: (page: number) => void
  /** Called when "Load More" is pressed (load-more mode). */
  onLoadMore?: () => void
  /** Slot overrides. */
  slots?: Record<string, Record<string, unknown>>
  style?: ViewStyle
  testID?: string
  id?: string
}

/**
 * Standalone Pagination — plain React props, no manifest required.
 *
 * @example
 * <PaginationBase mode="pages" currentPage={2} totalPages={10} onPageChange={setPage} />
 */
export function PaginationBase({
  mode = 'pages',
  currentPage,
  defaultPage = 1,
  totalPages = 1,
  onPageChange,
  onLoadMore,
  slots,
  style,
  testID,
  id,
}: PaginationBaseProps) {
  const tokens = useTokens()
  const sharedTextStyle = resolveNativeTextStyle({}, tokens)

  const isControlled = currentPage !== undefined
  const [internalPage, setInternalPage] = useState(defaultPage)
  const page = isControlled ? (currentPage as number) : internalPage

  useEffect(() => {
    if (isControlled) return
  }, [isControlled])

  const baseTestID = testID ?? id ?? 'pagination'

  const containerSurface = resolveSurfacePresentation({
    tokens,
    implementationBase: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      paddingY: 'md',
      gap: 'sm',
    },
    componentSurface: slots?.container,
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
        disabled: { opacity: 0.4 },
      },
    },
    componentSurface: slots?.navButton,
  })
  const pageIndicatorSurface = resolveSurfacePresentation({
    tokens,
    implementationBase: { paddingX: 'md' },
    componentSurface: slots?.pageIndicator,
  })
  const pageTextSurface = resolveSurfacePresentation({
    tokens,
    implementationBase: { fontSize: 'sm', color: 'muted' },
    componentSurface: slots?.pageText,
  })
  const currentPageSurface = resolveSurfacePresentation({
    tokens,
    implementationBase: { fontSize: 'sm', fontWeight: 'semibold', color: 'foreground' },
    componentSurface: slots?.currentPage,
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
    componentSurface: slots?.loadMoreButton,
  })
  const loadMoreTextSurface = resolveSurfacePresentation({
    tokens,
    implementationBase: { fontSize: 'sm', fontWeight: 'medium', color: 'primary' },
    componentSurface: slots?.loadMoreText,
  })

  const baseTextStyle: TextStyle = {
    ...sharedTextStyle,
    fontSize: tokens.typography.fontSizeSm,
  }

  const goToPage = (next: number) => {
    if (!isControlled) setInternalPage(next)
    onPageChange?.(next)
  }

  const handlePrevious = () => {
    if (page > 1) goToPage(page - 1)
  }

  const handleNext = () => {
    if (page < totalPages) goToPage(page + 1)
  }

  if (mode === 'infinite') {
    return <View style={style} testID={testID} />
  }

  if (mode === 'load-more') {
    return (
      <View style={[containerSurface.style as ViewStyle | undefined, style]} testID={testID}>
        <TouchableOpacity
          onPress={onLoadMore}
          style={loadMoreButtonSurface.style as ViewStyle | undefined}
          accessibilityRole="button"
          accessibilityLabel="Load more"
          testID={`${baseTestID}-load-more`}
          activeOpacity={0.7}
        >
          <Text
            style={{ ...baseTextStyle, ...(loadMoreTextSurface.style as TextStyle | undefined) }}
          >
            Load More
          </Text>
        </TouchableOpacity>
      </View>
    )
  }

  const isFirstPage = page <= 1
  const isLastPage = page >= totalPages

  function renderNavButton(params: {
    label: string
    onPress: () => void
    disabled: boolean
    testID: string
    accessibilityLabel: string
  }) {
    const activeStates: RuntimeSurfaceState[] | undefined = params.disabled
      ? ['disabled']
      : undefined

    return (
      <TouchableOpacity
        onPress={params.onPress}
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
        <Text style={{ ...baseTextStyle, color: tokens.colors.text }}>{params.label}</Text>
      </TouchableOpacity>
    )
  }

  return (
    <View
      style={[containerSurface.style as ViewStyle | undefined, style]}
      accessibilityRole="toolbar"
      accessibilityLabel="Pagination"
      testID={testID}
    >
      {renderNavButton({
        label: 'Previous',
        onPress: handlePrevious,
        disabled: isFirstPage,
        accessibilityLabel: 'Previous page',
        testID: `${baseTestID}-previous`,
      })}

      <View style={pageIndicatorSurface.style as ViewStyle | undefined}>
        <Text style={{ ...baseTextStyle, ...(pageTextSurface.style as TextStyle | undefined) }}>
          <Text
            style={{ ...baseTextStyle, ...(currentPageSurface.style as TextStyle | undefined) }}
          >
            {page}
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
  )
}
