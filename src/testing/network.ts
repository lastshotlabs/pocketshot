export interface TestNetworkState {
  isConnected: boolean
  isInternetReachable: boolean
  generation: number
}

type NetworkListener = (state: TestNetworkState) => void

export class NetworkHarness {
  private listeners = new Set<NetworkListener>()
  private value: TestNetworkState

  constructor(online = true) {
    this.value = {
      isConnected: online,
      isInternetReachable: online,
      generation: 0,
    }
  }

  subscribe(listener: NetworkListener): () => void {
    this.listeners.add(listener)
    listener(this.snapshot)
    return () => this.listeners.delete(listener)
  }

  setOnline(online: boolean): void {
    this.value = {
      isConnected: online,
      isInternetReachable: online,
      generation: this.value.generation + 1,
    }
    for (const listener of this.listeners) listener(this.snapshot)
  }

  async flap(count: number): Promise<void> {
    for (let index = 0; index < count; index += 1) {
      this.setOnline(false)
      await Promise.resolve()
      this.setOnline(true)
      await Promise.resolve()
    }
  }

  get snapshot(): TestNetworkState {
    return { ...this.value }
  }
}
