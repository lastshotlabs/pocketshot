export class DraftConflictError<T> extends Error {
  constructor(
    readonly remoteValue: T,
    readonly remoteVersion: string,
    message = 'Draft changed on the server',
  ) {
    super(message)
    this.name = 'DraftConflictError'
  }
}
