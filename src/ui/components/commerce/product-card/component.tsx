import React, { useCallback } from 'react'
import { ComponentWrapper } from '../../_base/ComponentWrapper'
import { useScreenContext } from '../../../context/ScreenContext'
import { resolveFromRef, isFromRef } from '../../_base/fromRef'
import { ProductCardBase } from './standalone'
import type { ProductCardConfig } from './types'

export function ProductCard({ config }: { config: ProductCardConfig }) {
  const { values, dispatch } = useScreenContext()

  const resolvedTitle = isFromRef(config.title)
    ? String(resolveFromRef(config.title, values) ?? '')
    : config.title
  const resolvedDescription =
    config.description != null
      ? isFromRef(config.description)
        ? String(resolveFromRef(config.description, values) ?? '')
        : config.description
      : undefined
  const resolvedImage =
    config.image != null
      ? isFromRef(config.image)
        ? String(resolveFromRef(config.image, values) ?? '')
        : config.image
      : undefined
  const resolvedPrice =
    config.price != null
      ? isFromRef(config.price)
        ? Number(resolveFromRef(config.price, values) ?? 0)
        : config.price
      : undefined
  const resolvedRating =
    config.rating != null
      ? isFromRef(config.rating)
        ? Number(resolveFromRef(config.rating, values) ?? 0)
        : config.rating
      : undefined
  const resolvedReviewCount =
    config.reviewCount != null
      ? isFromRef(config.reviewCount)
        ? Number(resolveFromRef(config.reviewCount, values) ?? 0)
        : config.reviewCount
      : undefined

  const handlePress = useCallback(() => {
    if (config.onPress) void dispatch(config.onPress)
  }, [config.onPress, dispatch])

  const handleAddToCart = useCallback(() => {
    if (config.onAddToCart) void dispatch(config.onAddToCart)
  }, [config.onAddToCart, dispatch])

  return (
    <ComponentWrapper id={config.id} testID={config.testID} config={config}>
      <ProductCardBase
        id={config.id}
        testID={config.testID}
        title={resolvedTitle}
        description={resolvedDescription}
        image={resolvedImage}
        price={resolvedPrice}
        rating={resolvedRating}
        reviewCount={resolvedReviewCount}
        badge={config.badge}
        currency={config.currency}
        onPress={config.onPress ? handlePress : undefined}
        onAddToCart={config.onAddToCart ? handleAddToCart : undefined}
        slots={config.slots as Record<string, Record<string, unknown>> | undefined}
      />
    </ComponentWrapper>
  )
}
