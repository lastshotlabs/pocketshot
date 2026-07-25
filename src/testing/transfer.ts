import { deferred, type FaultSequence } from './faults'

export interface TransferAttempt {
  uploadId: string
  offset: number
  bytes: number
}

export class InterruptibleTransferHarness {
  readonly attempts: TransferAttempt[] = []
  private interrupted = false
  private release = deferred<void>()

  interrupt(): void {
    this.interrupted = true
    this.release = deferred<void>()
  }

  resume(): void {
    this.interrupted = false
    this.release.resolve()
  }

  send = async (attempt: TransferAttempt): Promise<void> => {
    this.attempts.push({ ...attempt })
    if (this.interrupted) await this.release.promise
  }
}

export type TransferFaultSequence = FaultSequence<[TransferAttempt], void>
