import { DexieDiagramRepository } from './dexie-repository.js';
import { MemoryDiagramRepository } from './memory-repository.js';
import type { DiagramRepository } from './repository.js';

/**
 * Choose a repository based on the environment. IndexedDB is used in the browser;
 * in-memory storage is used where it is unavailable (tests, restricted contexts).
 */
export function createRepository(): DiagramRepository {
  if (typeof indexedDB === 'undefined') {
    return new MemoryDiagramRepository();
  }
  return new DexieDiagramRepository();
}
