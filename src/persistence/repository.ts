import type { Diagram, DiagramMeta } from '../domain/types.js';

/**
 * Persistence boundary. The UI and application services depend only on this
 * interface, never on Dexie or IndexedDB directly.
 */
export interface DiagramRepository {
  list(): Promise<DiagramMeta[]>;
  load(id: string): Promise<Diagram | undefined>;
  save(diagram: Diagram): Promise<void>;
  delete(id: string): Promise<void>;
}
