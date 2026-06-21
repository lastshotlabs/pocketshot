import React, { useCallback } from 'react'
import { ComponentWrapper } from '../../_base/ComponentWrapper'
import { useScreenContext } from '../../../context/ScreenContext'
import { resolveFromRef, isFromRef } from '../../_base/fromRef'
import { CartItemBase } from './standalone'
import type { CartItemConfig } from './types'

export function CartItem({ config }: { config: CartItemConfig }) {
  const { values, setValue, dispatch } = useScreenContext()

  const resolvedTitle = isFromRef(config.title)
    ? String(resolveFromRef(config.title, values) ?? '')
    : config.title
  const resolvedVariant =
    config.variant != null
      ? isFromRef(config.variant)
        ? String(resolveFromRef(config.variant, values) ?? '')
        : config.variant
      : undefined
  const resolvedImage =
    config.image != null
      ? isFromRef(config.image)
        ? String(resolveFromRef(config.image, values) ?? '')
        : config.image
      : undefined
  const resolvedPrice = isFromRef(config.price)
    ? Number(resolveFromRef(config.price, values) ?? 0)
    : config.price
  const resolvedQuantity = isFromRef(config.quantity)
    ? Number(resolveFromRef(config.quantity, values) ?? 1)
    : (config.quantity ?? 1)

  const handleQuantityChange = useCallback(
    (newQuantity: number) => {
      if (!config.onQuantityChange) return
      setValue('__cartItemId', config.id ?? '')
      setValue('__newQuantity', newQuantity)
      void dispatch(config.onQuantityChange)
    },
    [config.id, config.onQuantityChange, dispatch, setValue],
  )

  const handleRemove = useCallback(() => {
    if (!config.onRemove) return
    void dispatch(config.onRemove)
  }, [config.onRemove, dispatch])

  return (
    <ComponentWrapper id={config.id} testID={config.testID} config={config}>
      <CartItemBase
        id={config.id}
        testID={config.testID}
        title={resolvedTitle}
        variant={resolvedVariant}
        image={resolvedImage}
        price={resolvedPrice}
        quantity={resolvedQuantity}
        currency={config.currency}
        onQuantityChange={config.onQuantityChange ? handleQuantityChange : undefined}
        onRemove={config.onRemove ? handleRemove : undefined}
        slots={config.slots as Record<string, Record<string, unknown>> | undefined}
      />
    </ComponentWrapper>
  )
}
