import { LitElement, css, html } from 'lit';
import { customElement, property } from 'lit/decorators.js';

@customElement('erd-toolbar')
export class ErdToolbar extends LitElement {
  static override styles = css`
    :host {
      display: block;
    }

    .toolbar {
      display: flex;
      align-items: center;
      gap: 0.5rem;
      padding: 0.5rem 0.75rem;
      border-bottom: 1px solid #e2e8f0;
      background: #ffffff;
    }

    .brand {
      font-size: 0.95rem;
      font-weight: 600;
      letter-spacing: 0.01em;
    }

    .name {
      font: inherit;
      font-size: 0.85rem;
      padding: 0.35rem 0.5rem;
      border: 1px solid #cbd5e1;
      border-radius: 6px;
      min-width: 12rem;
    }

    .spacer {
      flex: 1;
    }

    button {
      font: inherit;
      font-size: 0.85rem;
      padding: 0.35rem 0.65rem;
      border: 1px solid #cbd5e1;
      border-radius: 6px;
      background: #f8fafc;
      color: inherit;
      cursor: pointer;
    }

    button:hover:not(:disabled) {
      background: #eef2f7;
    }

    button:disabled {
      opacity: 0.5;
      cursor: default;
    }

    button.active {
      border-color: #2563eb;
      background: #dbeafe;
      color: #1d4ed8;
    }

    .toggle {
      display: inline-flex;
      align-items: center;
      gap: 0.3rem;
      font-size: 0.8rem;
      color: #334155;
    }
  `;

  @property({ type: Boolean }) canUndo = false;
  @property({ type: Boolean }) canRedo = false;
  @property({ type: Boolean }) connectMode = false;
  @property({ type: Boolean }) gridVisible = true;
  @property({ type: Boolean }) gridSnap = false;
  @property() diagramName = '';

  override render() {
    return html`
      <header class="toolbar">
        <span class="brand">Barkerish</span>
        <input
          class="name"
          aria-label="Diagram name"
          .value=${this.diagramName}
          @input=${this.#onRename}
          @change=${() => this.#emit('rename-commit')}
        />
        <button @click=${() => this.#emit('add-entity')}>Add entity</button>
        <button
          class=${this.connectMode ? 'active' : ''}
          @click=${() => this.#emit('toggle-connect')}
        >
          ${this.connectMode ? 'Cancel relationship' : 'Add relationship'}
        </button>
        <span class="spacer"></span>
        <label class="toggle">
          <input
            type="checkbox"
            .checked=${this.gridVisible}
            @change=${() => this.#emit('toggle-grid')}
          />
          Grid
        </label>
        <label class="toggle">
          <input
            type="checkbox"
            .checked=${this.gridSnap}
            @change=${() => this.#emit('toggle-snap')}
          />
          Snap
        </label>
        <span class="spacer"></span>
        <button @click=${() => this.#emit('export-native')}>Export</button>
        <button @click=${() => this.#emit('import')}>Import</button>
        <button @click=${() => this.#emit('export-svg')}>SVG</button>
        <input
          class="file"
          type="file"
          accept=".json,.barkerish,application/json"
          hidden
          @change=${this.#onFile}
        />
        <span class="spacer"></span>
        <button ?disabled=${!this.canUndo} @click=${() => this.#emit('undo')}>Undo</button>
        <button ?disabled=${!this.canRedo} @click=${() => this.#emit('redo')}>Redo</button>
        <button @click=${() => this.#emit('zoom-out')}>Zoom out</button>
        <button @click=${() => this.#emit('zoom-in')}>Zoom in</button>
        <button @click=${() => this.#emit('zoom-fit')}>Fit</button>
      </header>
    `;
  }

  #onFile = (event: Event): void => {
    const input = event.target as HTMLInputElement;
    const file = input.files?.[0];
    if (file) {
      this.#emit('import', file);
    }
    input.value = '';
  };

  #onRename = (event: Event): void => {
    this.#emit('rename', (event.target as HTMLInputElement).value);
  };

  #emit<T>(type: string, detail?: T): void {
    this.dispatchEvent(new CustomEvent(type, { detail, bubbles: true, composed: true }));
  }
}

declare global {
  interface HTMLElementTagNameMap {
    'erd-toolbar': ErdToolbar;
  }
}
