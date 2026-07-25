type Deferred<T> = {
  promise: Promise<T>
  resolve(value: T): void
  reject(error: unknown): void
}

export function deferred<T>(): Deferred<T> {
  let resolve!: (value: T) => void
  let reject!: (error: unknown) => void
  const promise = new Promise<T>((resolvePromise, rejectPromise) => {
    resolve = resolvePromise
    reject = rejectPromise
  })
  return { promise, resolve, reject }
}

type Outcome<T> =
  | { kind: 'resolve'; value: T }
  | { kind: 'reject'; error: unknown }
  | { kind: 'defer'; deferred: Deferred<T> }

export class FaultSequence<TArgs extends unknown[], TResult> {
  private readonly outcomes: Outcome<TResult>[] = []
  readonly calls: TArgs[] = []

  resolve(value: TResult): this {
    this.outcomes.push({ kind: 'resolve', value })
    return this
  }

  reject(error: unknown): this {
    this.outcomes.push({ kind: 'reject', error })
    return this
  }

  defer(): Deferred<TResult> {
    const pending = deferred<TResult>()
    this.outcomes.push({ kind: 'defer', deferred: pending })
    return pending
  }

  invoke = async (...args: TArgs): Promise<TResult> => {
    this.calls.push(args)
    const outcome = this.outcomes.shift()
    if (!outcome) throw new Error('FaultSequence has no configured outcome')
    if (outcome.kind === 'resolve') return outcome.value
    if (outcome.kind === 'reject') throw outcome.error
    return outcome.deferred.promise
  }
}
