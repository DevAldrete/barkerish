import { css, html } from 'lit';
import { customElement, query } from 'lit/decorators.js';
import { createDiagram } from '../domain/model.js';
import { addEntity } from '../store/actions.js';
import { EditorStore } from '../store/editor-store.js';
import { StoreElement } from '../ui/store-element.js';
import '../ui/erd-canvas.js';
import type { ErdCanvas } from '../ui/erd-canvas.js';

@customElement('barker-app')
export class BarkerApp extends StoreElement {
  static override styles = css`
    :host {
      display: block;
      height: 100vh;
    }

    .app {
      display: flex;
      flex-direction: column;
      height: 100%;
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
      letter-spacing: 0.01em;
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

    .workspace {
      position: relative;
      flex: 1;
      min-height: 0;
    }

    erd-canvas {
      position: absolute;
      inset: 0;
    }
  `;

  @query('erd-canvas') private canvas!: ErdCanvas;

  constructor() {
    super();
    this.store = new EditorStore(createDiagram('Untitled Diagram'));
  }

  override render() {
    const { canUndo, canRedo } = this.store;

    return html`
      <div class="app">
        <header class="toolbar">
          <strong class="brand">Barkerish</strong>
          <button @click=${this.#onAddEntity}>Add entity</button>
          <span class="spacer"></span>
          <button ?disabled=${!canUndo} @click=${() => this.store.undo()}>Undo</button>
          <button ?disabled=${!canRedo} @click=${() => this.store.redo()}>Redo</button>
          <button @click=${() => this.canvas.zoomOut()}>Zoom out</button>
          <button @click=${() => this.canvas.zoomIn()}>Zoom in</button>
          <button @click=${() => this.canvas.zoomToFit()}>Fit</button>
        </header>
        <main class="workspace">
          <erd-canvas .store=${this.store}></erd-canvas>
        </main>
      </div>
    `;
  }

  #onAddEntity = (): void => {
    addEntity(this.store);
  };
}

declare global {
  interface HTMLElementTagNameMap {
    'barker-app': BarkerApp;
  }
}
