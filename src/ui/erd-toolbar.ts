import { LitElement, css, html } from 'lit';
import { customElement, property } from 'lit/decorators.js';
import { THEMES } from '../theme/themes.js';
import type { ThemeId } from '../theme/themes.js';
import { BASE_STYLES } from './base-styles.js';

@customElement('erd-toolbar')
export class ErdToolbar extends LitElement {
  static override styles = css`
    ${BASE_STYLES}

    :host {
      display: block;
    }

    .toolbar {
      display: flex;
      align-items: center;
      gap: 0.5rem;
      padding: 0.5rem 0.75rem;
      border-bottom: 1px solid var(--erd-border);
      background: var(--erd-surface);
      color: var(--erd-text);
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
      border: 1px solid var(--erd-border-strong);
      border-radius: 6px;
      min-width: 12rem;
      background: var(--erd-surface-2);
      color: var(--erd-text);
    }

    .spacer {
      flex: 1;
    }

    button {
      font: inherit;
      font-size: 0.85rem;
      padding: 0.35rem 0.65rem;
      border: 1px solid var(--erd-border-strong);
      border-radius: 6px;
      background: var(--erd-surface-2);
      color: inherit;
      cursor: pointer;
    }

    button:hover:not(:disabled) {
      background: var(--erd-border);
    }

    button:disabled {
      opacity: 0.5;
      cursor: default;
    }

    button.active {
      border-color: var(--erd-accent);
      background: var(--erd-accent-soft);
      color: var(--erd-accent-strong);
    }

    .toggle {
      display: inline-flex;
      align-items: center;
      gap: 0.3rem;
      font-size: 0.8rem;
      color: var(--erd-text-muted);
    }

    select {
      font: inherit;
      font-size: 0.8rem;
      padding: 0.3rem 0.4rem;
      border: 1px solid var(--erd-border-strong);
      border-radius: 6px;
      background: var(--erd-surface-2);
      color: var(--erd-text);
      cursor: pointer;
    }
  `;

  @property({ type: Boolean }) canUndo = false;
  @property({ type: Boolean }) canRedo = false;
  @property({ type: Boolean }) connectMode = false;
  @property({ type: Boolean }) textOpen = false;
  @property({ type: Boolean }) gridVisible = true;
  @property({ type: Boolean }) gridSnap = false;
  @property() diagramName = '';
  @property() theme: ThemeId = 'light';

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
        <button class=${this.textOpen ? 'active' : ''} @click=${() => this.#emit('toggle-text')}>
          Text
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
        <select
          aria-label="Theme"
          .value=${this.theme}
          @change=${(event: Event) =>
            this.#emit('theme', (event.target as HTMLSelectElement).value as ThemeId)}
        >
          ${Object.entries(THEMES).map(
            ([id, definition]) =>
              html`<option value=${id} ?selected=${id === this.theme}>${definition.label}</option>`,
          )}
        </select>
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
