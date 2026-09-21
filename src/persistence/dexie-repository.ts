import Dexie from 'dexie';
import type { Table } from 'dexie';
import type { Diagram, DiagramMeta } from '../domain/types.js';
import type { DiagramRepository } from './repository.js';

class BarkerishDatabase extends Dexie {
  diagrams!: Table<Diagram, string>;

  constructor() {
    super('barkerish');
    this.version(1).stores({ diagrams: 'id, updatedAt' });
  }
}

/** IndexedDB-backed repository. One row per diagram, storing the native document. */
export class DexieDiagramRepository implements DiagramRepository {
  #db: BarkerishDatabase;

  constructor(db: BarkerishDatabase = new BarkerishDatabase()) {
    this.#db = db;
  }

  async list(): Promise<DiagramMeta[]> {
    const records = await this.#db.diagrams.toArray();
    return records
      .map((diagram) => ({
        id: diagram.id,
        name: diagram.name,
        createdAt: diagram.createdAt,
        updatedAt: diagram.updatedAt,
      }))
      .sort((a, b) => b.updatedAt.localeCompare(a.updatedAt));
  }

  async load(id: string): Promise<Diagram | undefined> {
    return this.#db.diagrams.get(id);
  }

  async save(diagram: Diagram): Promise<void> {
    await this.#db.diagrams.put(diagram);
  }

  async delete(id: string): Promise<void> {
    await this.#db.diagrams.delete(id);
  }
}
