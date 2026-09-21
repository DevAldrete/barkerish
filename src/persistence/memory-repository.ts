import type { Diagram, DiagramMeta } from '../domain/types.js';
import type { DiagramRepository } from './repository.js';

/** In-memory repository used for tests and as a fallback without IndexedDB. */
export class MemoryDiagramRepository implements DiagramRepository {
  #records = new Map<string, Diagram>();

  async list(): Promise<DiagramMeta[]> {
    return [...this.#records.values()]
      .map(toMeta)
      .sort((a, b) => b.updatedAt.localeCompare(a.updatedAt));
  }

  async load(id: string): Promise<Diagram | undefined> {
    const record = this.#records.get(id);
    return record ? structuredClone(record) : undefined;
  }

  async save(diagram: Diagram): Promise<void> {
    this.#records.set(diagram.id, structuredClone(diagram));
  }

  async delete(id: string): Promise<void> {
    this.#records.delete(id);
  }
}

function toMeta(diagram: Diagram): DiagramMeta {
  return {
    id: diagram.id,
    name: diagram.name,
    createdAt: diagram.createdAt,
    updatedAt: diagram.updatedAt,
  };
}
