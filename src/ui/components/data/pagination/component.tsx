import React, { useCallback, useMemo, useState } from 'react'
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native'
import { ComponentWrapper } from '../../_base/ComponentWrapper'
import { useTokens } from '../../../context/AppContext'
import { useScreenContext } from '../../../context/ScreenContext'
import { resolveFromRef } from '../../_base/fromRef'
import type { DesignTokens } from '../../../tokens/types'
import type { PaginationConfig } from './types'

// ---------------------------------------------------------------------------
// Styles
// ---------------------------------------------------------------------------

function makeStyles(tokens: DesignTokens) {
  return StyleSheet.create({
    container: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      paddingVertical: tokens.spacing[3],
      gap: tokens.spacing[2],
    },
    navButton: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      paddingHorizontal: tokens.spacing[3],
      paddingVertical: tokens.spacing[2],
      borderRadius: tokens.radius.md,
      borderWidth: 1,
      borderColor: tokens.colors.border,
      backgroundColor: tokens.colors.surface,
    },
    navButtonDisabled: {
      opacity: 0.4,
    },
    navButtonText: {
      fontSize: tokens.typography.fontSizeSm,
      fontWeight: tokens.typography.fontWeightMedium,
      color: tokens.colors.text,
    },
    pageIndicator: {
      paddingHorizontal: tokens.spacing[3],
    },
    pageText: {
      fontSize: tokens.typography.fontSizeSm,
      color: tokens.colors.textMuted,
    },
    pageTextCurrent: {
      fontWeight: tokens.typography.fontWeightSemibold,
      color: tokens.colors.text,
    },
    loadMoreButton: {
      alignItems: 'center',
      justifyContent: 'center',
      paddingVertical: tokens.spacing[3],
      paddingHorizontal: tokens.spacing[5],
      borderRadius: tokens.radius.md,
      backgroundColor: tokens.colors.surfaceAlt,
      borderWidth: 1,
      borderColor: tokens.colors.border,
      alignSelf: 'center',
    },
    loadMoreText: {
      fontSize: tokens.typography.fontSizeSm,
      fontWeight: tokens.typography.fontWeightMedium,
      color: tokens.colors.primary,
    },
  })
}

// ---------------------------------------------------------------------------
// Pagination
// ---------------------------------------------------------------------------

/**
 * Page navigation or load-more component.
 * - Pages mode: previous/next buttons + page indicator
 * - Load-more mode: "Load More" button
 * - Infinite mode: renders nothing (parent FlatList handles onEndReached)
 *
 * Publishes current page to ScreenContext via setValue.
 */
export function Pagination({ config }: { config: PaginationConfig }) {
  const tokens = useTokens()
  const { setValue, dispatch, values } = useScreenContext()
  const styles = useMemo(() => makeStyles(tokens), [tokens])

  // Resolve currentPage from from-ref or direct value
  const resolvedCurrentPage = resolveFromRef<number | undefined>(
    config.currentPage as number | { from: string } | undefined,
    values,
  )

  const [internalPage, setInternalPage] = useState(resolvedCurrentPage ?? 1)
  const currentPage = resolvedCurrentPage ?? internalPage
  const totalPages = config.totalPages ?? 1

  const baseTestID = config.testID ?? config.id

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
    [config.id, config.onPageChange, setValue, dispatch],
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
  }, [currentPage, totalPages, goToPage])

  const handleLoadMore = useCallback(async () => {
    if (config.onLoadMore) {
      await dispatch(config.onLoadMore)
    }
  }, [config.onLoadMore, dispatch])

  // Infinite mode renders nothing visible
  if (config.mode === 'infinite') {
    return <ComponentWrapper id={config.id} testID={config.testID} config={config}><View /></ComponentWrapper>
  }

  // Load-more mode
  if (config.mode === 'load-more') {
    return (
      <ComponentWrapper id={config.id} testID={config.testID} config={config}>
        <View style={styles.container}>
          <TouchableOpacity
            onPress={handleLoadMore}
            style={styles.loadMoreButton}
            accessibilityRole="button"
            accessibilityLabel="Load more"
            testID={`${baseTestID}-load-more`}
            activeOpacity={0.7}
          >
            <Text style={styles.loadMoreText}>Load More</Text>
          </TouchableOpacity>
        </View>
      </ComponentWrapper>
    )
  }

  // Pages mode
  const isFirstPage = currentPage <= 1
  const isLastPage = currentPage >= totalPages

  return (
    <ComponentWrapper id={config.id} testID={config.testID} config={config}>
      <View style={styles.container} accessibilityRole="toolbar" accessibilityLabel="Pagination">
        <TouchableOpacity
          onPress={handlePrevious}
          style={[styles.navButton, isFirstPage && styles.navButtonDisabled]}
          disabled={isFirstPage}
          accessibilityRole="button"
          accessibilityLabel="Previous page"
          accessibilityState={{ disabled: isFirstPage }}
          testID={`${baseTestID}-previous`}
          activeOpacity={0.7}
        >
          <Text style={styles.navButtonText}>← Previous</Text>
        </TouchableOpacity>

        <View style={styles.pageIndicator}>
          <Text style={styles.pageText}>
            <Text style={styles.pageTextCurrent}>{currentPage}</Text>
            {' / '}
            {totalPages}
          </Text>
        </View>

        <TouchableOpacity
          onPress={handleNext}
          style={[styles.navButton, isLastPage && styles.navButtonDisabled]}
          disabled={isLastPage}
          accessibilityRole="button"
          accessibilityLabel="Next page"
          accessibilityState={{ disabled: isLastPage }}
          testID={`${baseTestID}-next`}
          activeOpacity={0.7}
        >
          <Text style={styles.navButtonText}>Next →</Text>
        </TouchableOpacity>
      </View>
    </ComponentWrapper>
  )
}

