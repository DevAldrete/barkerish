import { createDiagram } from '../domain/model.js';
import type { DiagramMeta } from '../domain/types.js';
import { Autosave } from '../persistence/autosave.js';
import type { DiagramRepository } from '../persistence/repository.js';
import type { EditorStore } from './editor-store.js';

const LAST_ID_KEY = 'barkerish:lastDiagram';

/**
 * Coordinates the open document with the repository: lists diagrams, opens and
 * creates them, and keeps the current one autosaved.
 */
export class DocumentManager extends EventTarget {
  #store: EditorStore;
  #repository: DiagramRepository;
  #autosave: Autosave;
  #diagrams: DiagramMeta[] = [];
  #currentId: string | null = null;

  constructor(store: EditorStore, repository: DiagramRepository) {
    super();
    this.#store = store;
    this.#repository = repository;
    this.#autosave = new Autosave(store, repository);
  }

  get diagrams(): DiagramMeta[] {
    return this.#diagrams.map((diagram) =>
      diagram.id === this.#currentId
        ? { ...diagram, name: this.#store.diagram.name, updatedAt: this.#store.diagram.updatedAt }
        : diagram,
    );
  }

  get currentId(): string | null {
    return this.#currentId;
  }

  async init(): Promise<void> {
    this.#autosave.start();
    await this.refresh();

    const lastId = readLastId();
    const last = lastId ? this.#diagrams.find((diagram) => diagram.id === lastId) : undefined;
    const first = this.#diagrams[0];

    if (last) {
      await this.open(last.id);
    } else if (first) {
      await this.open(first.id);
    } else {
      await this.create();
    }
  }

  async refresh(): Promise<void> {
    this.#diagrams = await this.#repository.list();
    this.#emit();
  }

  async open(id: string): Promise<void> {
    if (id === this.#currentId) {
      return;
    }

    await this.#autosave.flush();
    const diagram = await this.#repository.load(id);
    if (!diagram) {
      return;
    }

    this.#store.load(diagram);
    this.#currentId = id;
    writeLastId(id);
    this.#emit();
  }

  async create(name?: string): Promise<void> {
    await this.#autosave.flush();
    const diagram = createDiagram(name ?? `Diagram ${this.#diagrams.length + 1}`);
    await this.#repository.save(diagram);

    this.#store.load(diagram);
    this.#currentId = diagram.id;
    writeLastId(diagram.id);
    await this.refresh();
  }

  async remove(id: string): Promise<void> {
    await this.#repository.delete(id);

    if (id === this.#currentId) {
      this.#currentId = null;
      await this.refresh();
      const next = this.#diagrams[0];
      if (next) {
        await this.open(next.id);
      } else {
        await this.create();
      }
      return;
    }

    await this.refresh();
  }

  dispose(): void {
    this.#autosave.stop();
  }

  #emit(): void {
    this.dispatchEvent(new Event('change'));
  }
}

function readLastId(): string | null {
  try {
    return localStorage.getItem(LAST_ID_KEY);
  } catch {
    return null;
  }
}

function writeLastId(id: string): void {
  try {
    localStorage.setItem(LAST_ID_KEY, id);
  } catch {
    // Storage may be unavailable; opening the last diagram is a convenience only.
  }
}
