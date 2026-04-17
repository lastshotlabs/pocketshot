import { describe, expect, it } from 'vitest'

import { resolveNativeStyleProps } from '../../src/ui/components/_base/style-props'
import { resolveSurfacePresentation } from '../../src/ui/components/_base/style-surfaces'
import { resolveContractTokens } from '../../src/ui/tokens/contract'

const tokens = resolveContractTokens(
  {
    flavor: 'neutral',
    mode: 'light',
  },
  'light',
)

describe('native universal styling runtime', () => {
  it('maps shared style props into React Native style values', () => {
    const style = resolveNativeStyleProps(
      {
        bg: 'primary',
        color: 'primary-foreground',
        padding: 'lg',
        paddingX: 'xl',
        borderRadius: 'lg',
        border: '2px solid border',
        shadow: 'md',
        alignItems: 'start',
        justifyContent: 'between',
        fontSize: 'lg',
        fontWeight: 'semibold',
        lineHeight: 'relaxed',
        letterSpacing: 'wide',
      },
      tokens,
    )

    expect(style).toMatchObject({
      backgroundColor: tokens.colors.primary,
      color: tokens.colors.primaryForeground,
      padding: tokens.spacing[4],
      paddingLeft: tokens.spacing[6],
      paddingRight: tokens.spacing[6],
      borderRadius: tokens.radius.lg,
      borderWidth: 2,
      borderColor: tokens.colors.border,
      alignItems: 'flex-start',
      justifyContent: 'space-between',
      fontSize: tokens.typography.fontSizeLg,
      fontWeight: '600',
      letterSpacing: 0.25,
    })

    expect(style.lineHeight).toBe(tokens.typography.fontSizeLg * 1.75)
    expect(style.shadowColor).toBe(tokens.shadows.md.shadowColor)
  })

  it('supports parity fields used by internal universal surfaces', () => {
    const style = resolveNativeStyleProps(
      {
        color: 'errorForeground',
        backgroundColor: 'error',
        paddingTop: 'lg',
        paddingRight: 'sm',
        marginBottom: 'xs',
        top: 'sm',
        right: '50%',
        flexGrow: 1,
        flexShrink: '0',
        alignSelf: 'start',
        borderTopWidth: 2,
        borderTopColor: 'divider',
        borderBottomWidth: '1',
        borderBottomColor: 'inputBorder',
        borderTopLeftRadius: 'xl',
        borderTopRightRadius: 'lg',
        textDecorationLine: 'line-through',
        fontStyle: 'italic',
        textTransform: 'uppercase',
        zIndex: 'toast',
        aspectRatio: '1.5',
        inset: 'md',
      },
      tokens,
    )

    expect(style).toMatchObject({
      color: tokens.colors.errorForeground,
      backgroundColor: tokens.colors.error,
      paddingTop: tokens.spacing[4],
      paddingRight: tokens.spacing[2],
      marginBottom: tokens.spacing[1],
      top: tokens.spacing[2],
      right: '50%',
      bottom: tokens.spacing[3],
      left: tokens.spacing[3],
      flexGrow: 1,
      flexShrink: 0,
      alignSelf: 'flex-start',
      borderTopWidth: 2,
      borderTopColor: tokens.colors.divider,
      borderBottomWidth: 1,
      borderBottomColor: tokens.colors.inputBorder,
      borderTopLeftRadius: tokens.radius.xl,
      borderTopRightRadius: tokens.radius.lg,
      textDecorationLine: 'line-through',
      fontStyle: 'italic',
      textTransform: 'uppercase',
      zIndex: tokens.zIndex.toast,
      aspectRatio: 1.5,
    })
  })

  it('merges implementation, component, item, and active state surfaces in canonical order', () => {
    const presentation = resolveSurfacePresentation({
      tokens,
      implementationBase: {
        padding: 'sm',
        bg: 'muted',
        states: {
          open: {
            bg: 'accent',
          },
        },
      },
      componentSurface: {
        padding: 'lg',
        color: 'foreground',
        states: {
          open: {
            color: 'accent-foreground',
          },
          disabled: {
            opacity: 0.4,
          },
        },
      },
      itemSurface: {
        marginY: 'xs',
        states: {
          open: {
            shadow: 'lg',
          },
        },
      },
      activeStates: ['disabled', 'open'],
    })

    expect(presentation.resolvedConfigForWrapper).toMatchObject({
      padding: 'lg',
      bg: 'accent',
      color: 'accent-foreground',
      marginY: 'xs',
      opacity: 0.4,
      shadow: 'lg',
    })

    expect(presentation.style).toMatchObject({
      backgroundColor: tokens.colors.accent,
      color: tokens.colors.accentForeground,
      padding: tokens.spacing[4],
      marginTop: tokens.spacing[1],
      marginBottom: tokens.spacing[1],
      opacity: 0.4,
      shadowColor: tokens.shadows.lg.shadowColor,
    })
  })
})
