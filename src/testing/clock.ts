interface ScheduledTask {
  id: number
  at: number
  callback: () => void
}

export class DeterministicClock {
  private current: number
  private nextId = 1
  private readonly tasks = new Map<number, ScheduledTask>()

  constructor(start: Date | number = new Date('2026-01-01T00:00:00.000Z')) {
    this.current = typeof start === 'number' ? start : start.getTime()
  }

  now = (): number => this.current

  date = (): Date => new Date(this.current)

  setTimer = (callback: () => void, delay: number): ReturnType<typeof setTimeout> => {
    const id = this.nextId++
    this.tasks.set(id, {
      id,
      at: this.current + Math.max(0, delay),
      callback,
    })
    return id as unknown as ReturnType<typeof setTimeout>
  }

  clearTimer = (timer: ReturnType<typeof setTimeout>): void => {
    this.tasks.delete(timer as unknown as number)
  }

  async advance(milliseconds: number): Promise<void> {
    if (milliseconds < 0) throw new Error('Cannot move deterministic time backwards')
    const target = this.current + milliseconds
    while (true) {
      const next = this.nextTask(target)
      if (!next) break
      this.current = next.at
      this.tasks.delete(next.id)
      next.callback()
      await this.settle()
    }
    this.current = target
    await this.settle()
  }

  async runAll(maxTasks = 10_000): Promise<void> {
    let executed = 0
    while (this.tasks.size) {
      if (executed++ >= maxTasks) {
        throw new Error(`Deterministic timer limit exceeded (${maxTasks})`)
      }
      const next = this.nextTask(Number.POSITIVE_INFINITY)!
      await this.advance(next.at - this.current)
    }
  }

  get pendingTimers(): number {
    return this.tasks.size
  }

  private nextTask(target: number): ScheduledTask | null {
    let selected: ScheduledTask | null = null
    for (const task of this.tasks.values()) {
      if (task.at > target) continue
      if (
        !selected ||
        task.at < selected.at ||
        (task.at === selected.at && task.id < selected.id)
      ) {
        selected = task
      }
    }
    return selected
  }

  private async settle(): Promise<void> {
    await Promise.resolve()
    await Promise.resolve()
  }
}
