import { DeterministicClock } from './clock'
import { LifecycleHarness } from './lifecycle'
import { NetworkHarness } from './network'
import { RestartableStore } from './process'
import { InterruptibleTransferHarness } from './transfer'

export class ReliabilityHarness {
  readonly clock: DeterministicClock
  readonly lifecycle: LifecycleHarness
  readonly network: NetworkHarness
  readonly processStore: RestartableStore
  readonly transfer: InterruptibleTransferHarness

  constructor(options?: { start?: Date | number; online?: boolean }) {
    this.clock = new DeterministicClock(options?.start)
    this.lifecycle = new LifecycleHarness()
    this.network = new NetworkHarness(options?.online ?? true)
    this.processStore = new RestartableStore()
    this.transfer = new InterruptibleTransferHarness()
  }

  restartProcess(): number {
    this.lifecycle.transition('background')
    this.processStore.restart()
    this.lifecycle.transition('active')
    return this.processStore.generation
  }
}
