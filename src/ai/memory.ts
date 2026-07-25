import type { AiMemoryAdapter, AiMemoryFact } from './types'

export interface AiContextStatus {
  facts: number
  trustedFacts: number
  untrustedFacts: number
}

export class AiMemoryController {
  private facts: AiMemoryFact[] = []

  constructor(private readonly adapter: AiMemoryAdapter) {}

  async load(): Promise<AiMemoryFact[]> {
    this.facts = await this.adapter.list()
    return this.list()
  }

  list(): AiMemoryFact[] {
    return this.facts.map((fact) => ({ ...fact }))
  }

  status(): AiContextStatus {
    const trustedFacts = this.facts.filter((fact) => fact.trusted).length
    return {
      facts: this.facts.length,
      trustedFacts,
      untrustedFacts: this.facts.length - trustedFacts,
    }
  }

  async create(input: Omit<AiMemoryFact, 'id' | 'createdAt' | 'updatedAt'>): Promise<AiMemoryFact> {
    const fact = await this.adapter.create(input)
    this.facts.push(fact)
    return { ...fact }
  }

  async update(
    id: string,
    patch: Partial<Pick<AiMemoryFact, 'content' | 'trusted'>>,
  ): Promise<AiMemoryFact> {
    const fact = await this.adapter.update(id, patch)
    this.facts = this.facts.map((item) => (item.id === id ? fact : item))
    return { ...fact }
  }

  async remove(id: string): Promise<void> {
    await this.adapter.remove(id)
    this.facts = this.facts.filter((fact) => fact.id !== id)
  }
}
