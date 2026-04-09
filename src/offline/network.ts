import { useEffect, useState } from 'react'
import type { NetworkStatus } from './types'

// ── Optional peer dep ─────────────────────────────────────────────────────────

function tryLoadNetInfo() {
  try {
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    return require('@react-native-community/netinfo') as {
      fetch(): Promise<{
        isConnected: boolean | null
        isInternetReachable: boolean | null
        type: string
      }>
      addEventListener(
        cb: (state: {
          isConnected: boolean | null
          isInternetReachable: boolean | null
          type: string
        }) => void,
      ): () => void
    }
  } catch {
    return null
  }
}

const DEFAULT_STATUS: NetworkStatus = {
  isConnected: true,
  isInternetReachable: null,
  type: null,
}

/**
 * Returns current network connectivity status.
 * Uses @react-native-community/netinfo if installed; falls back to a fetch-based check.
 */
export async function checkNetworkStatus(): Promise<NetworkStatus> {
  const NetInfo = tryLoadNetInfo()
  if (NetInfo) {
    const state = await NetInfo.fetch()
    return {
      isConnected: state.isConnected ?? true,
      isInternetReachable: state.isInternetReachable,
      type: state.type,
    }
  }
  // Fallback: HEAD request to a reliable endpoint
  try {
    const res = await fetch('https://clients3.google.com/generate_204', {
      method: 'HEAD',
    })
    return { isConnected: res.ok, isInternetReachable: res.ok, type: null }
  } catch {
    return { isConnected: false, isInternetReachable: false, type: null }
  }
}

/**
 * Hook that subscribes to network status changes.
 * Polls every 30s as a fallback when netinfo is unavailable.
 *
 * @example
 * const { isConnected, type } = useNetworkStatus()
 */
export function useNetworkStatus(): NetworkStatus {
  const [status, setStatus] = useState<NetworkStatus>(DEFAULT_STATUS)

  useEffect(() => {
    const NetInfo = tryLoadNetInfo()

    if (NetInfo) {
      // Use netinfo listener
      void NetInfo.fetch().then((state) => {
        setStatus({
          isConnected: state.isConnected ?? true,
          isInternetReachable: state.isInternetReachable,
          type: state.type,
        })
      })
      const unsub = NetInfo.addEventListener((state) => {
        setStatus({
          isConnected: state.isConnected ?? true,
          isInternetReachable: state.isInternetReachable,
          type: state.type,
        })
      })
      return unsub
    }

    // Fallback: poll every 30s
    let mounted = true
    const poll = async () => {
      if (!mounted) return
      const s = await checkNetworkStatus()
      if (mounted) setStatus(s)
    }
    void poll()
    const interval = setInterval(() => void poll(), 30_000)
    return () => {
      mounted = false
      clearInterval(interval)
    }
  }, [])

  return status
}
