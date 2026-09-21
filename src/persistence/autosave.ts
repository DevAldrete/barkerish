import type { EditorStore } from '../store/editor-store.js';
import type { DiagramRepository } from './repository.js';

export const AUTOSAVE_DELAY = 500;

/**
 * Persists the store's diagram shortly after it changes, and flushes pending work
 * when the page is hidden or unloaded.
 */
export class Autosave {
  #store: EditorStore;
  #repository: DiagramRepository;
  #delay: number;
  #timer: ReturnType<typeof setTimeout> | undefined;
  #running = false;

  constructor(store: EditorStore, repository: DiagramRepository, delay = AUTOSAVE_DELAY) {
    this.#store = store;
    this.#repository = repository;
    this.#delay = delay;
  }

  start(): void {
    if (this.#running) {
      return;
    }
    this.#running = true;
    this.#store.addEventListener('change', this.#schedule);
    window.addEventListener('beforeunload', this.#onBeforeUnload);
    document.addEventListener('visibilitychange', this.#onVisibilityChange);
  }

  stop(): void {
    if (!this.#running) {
      return;
    }
    this.#running = false;
    this.#store.removeEventListener('change', this.#schedule);
    window.removeEventListener('beforeunload', this.#onBeforeUnload);
    document.removeEventListener('visibilitychange', this.#onVisibilityChange);
    this.#cancel();
  }

  async flush(): Promise<void> {
    this.#cancel();
    if (!this.#store.dirty) {
      return;
    }

    const diagram = this.#store.diagram;
    await this.#repository.save(diagram);
    if (this.#store.diagram === diagram) {
      this.#store.markSaved();
    }
  }

  #schedule = (): void => {
    if (!this.#store.dirty) {
      return;
    }
    this.#cancel();
    this.#timer = setTimeout(() => {
      this.#timer = undefined;
      void this.flush();
    }, this.#delay);
  };

  #cancel(): void {
    if (this.#timer !== undefined) {
      clearTimeout(this.#timer);
      this.#timer = undefined;
    }
  }

  #onBeforeUnload = (): void => {
    void this.flush();
  };

  #onVisibilityChange = (): void => {
    if (document.visibilityState === 'hidden') {
      void this.flush();
    }
  };
}
