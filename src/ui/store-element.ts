import { LitElement } from 'lit';
import type { EditorStore } from '../store/editor-store.js';

/**
 * Base element for components that render from an {@link EditorStore}. The store
 * is assigned as a property and the element re-renders whenever it changes.
 */
export abstract class StoreElement extends LitElement {
  #store?: EditorStore;

  get store(): EditorStore {
    if (!this.#store) {
      throw new Error(`<${this.tagName.toLowerCase()}> requires a store before use.`);
    }
    return this.#store;
  }

  set store(value: EditorStore) {
    if (this.#store === value) {
      return;
    }
    if (this.isConnected) {
      this.#store?.removeEventListener('change', this.#onStoreChange);
    }
    this.#store = value;
    if (this.isConnected) {
      value.addEventListener('change', this.#onStoreChange);
    }
    this.requestUpdate();
  }

  override connectedCallback(): void {
    super.connectedCallback();
    this.#store?.addEventListener('change', this.#onStoreChange);
  }

  override disconnectedCallback(): void {
    this.#store?.removeEventListener('change', this.#onStoreChange);
    super.disconnectedCallback();
  }

  #onStoreChange = (): void => {
    this.requestUpdate();
  };
}
