/**
 * Wraps components that require ScreenContext / AppContext with mock providers
 * so they render correctly in the showcase without a real backend.
 */
import React from 'react'
import { AppContextProvider, ScreenContextProvider, resolveTokens } from '@lastshotlabs/pocketshot/ui'
import { pocketshot } from './pocketshot'

const tokens = resolveTokens({ flavor: 'neutral', colorScheme: 'light' }, 'light')

interface Props {
  children: React.ReactNode
}

export function MockProviders({ children }: Props) {
  return (
    <AppContextProvider api={pocketshot.api} tokens={tokens} tokenConfig={{ flavor: 'neutral' }}>
      <ScreenContextProvider api={pocketshot.api}>
        {children}
      </ScreenContextProvider>
    </AppContextProvider>
  )
}
