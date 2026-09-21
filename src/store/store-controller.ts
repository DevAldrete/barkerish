import type { ReactiveController, ReactiveControllerHost } from 'lit';
import type { EditorStore } from './editor-store.js';

/** Binds an {@link EditorStore} to a Lit component, requesting updates on change. */
export class StoreController implements ReactiveController {
  #host: ReactiveControllerHost;
  #store: EditorStore;

  constructor(host: ReactiveControllerHost, store: EditorStore) {
    this.#host = host;
    this.#store = store;
    host.addController(this);
  }

  hostConnected(): void {
    this.#store.addEventListener('change', this.#onChange);
  }

  hostDisconnected(): void {
    this.#store.removeEventListener('change', this.#onChange);
  }

  #onChange = (): void => {
    this.#host.requestUpdate();
  };
}
