import { css, html, nothing } from 'lit';
import { customElement, query, state } from 'lit/decorators.js';
import { createDiagram, createRelationship, createRelationshipEnd } from '../domain/model.js';
import { downloadText } from '../io/download.js';
import { createRepository } from '../persistence/create-repository.js';
import { parseDiagramFile, serializeDiagram } from '../persistence/native-format.js';
import { serializeDiagramSvg } from '../render/svg-export.js';
import { addEntity } from '../store/actions.js';
import { DocumentManager } from '../store/document-manager.js';
import { EditorStore } from '../store/editor-store.js';
import { StoreElement } from '../ui/store-element.js';
import '../ui/diagram-list.js';
import '../ui/erd-canvas.js';
import '../ui/erd-toolbar.js';
import '../ui/entity-inspector.js';
import '../ui/relationship-inspector.js';
import '../ui/zoom-controls.js';
import type { ErdCanvas } from '../ui/erd-canvas.js';
import type { EntityInspector } from '../ui/entity-inspector.js';
import type { RelationshipInspector } from '../ui/relationship-inspector.js';

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

    .body {
      display: flex;
      flex: 1;
      min-height: 0;
    }

    .documents {
      width: 14rem;
      flex-shrink: 0;
    }

    .workspace {
      position: relative;
      flex: 1;
      min-width: 0;
    }

    erd-canvas {
      position: absolute;
      inset: 0;
    }

    .hint {
      position: absolute;
      top: 0.75rem;
      left: 50%;
      transform: translateX(-50%);
      padding: 0.4rem 0.75rem;
      border-radius: 999px;
      background: #1d4ed8;
      color: #ffffff;
      font-size: 0.78rem;
      pointer-events: none;
      box-shadow: 0 2px 8px rgb(15 23 42 / 20%);
    }

    .sidebar {
      width: 20rem;
      flex-shrink: 0;
      border-left: 1px solid #e2e8f0;
      background: #f8fafc;
      overflow: auto;
    }

    .empty {
      padding: 0.9rem;
      font-size: 0.8rem;
      color: #94a3b8;
    }
  `;

  @query('erd-canvas') private canvas!: ErdCanvas;
  @query('entity-inspector') private entityInspector!: EntityInspector;
  @query('relationship-inspector') private relationshipInspector!: RelationshipInspector;

  /** undefined = not connecting, null = picking source, string = picking target. */
  @state() private connectFrom: string | null | undefined = undefined;

  readonly #manager: DocumentManager;

  constructor() {
    super();
    this.store = new EditorStore(createDiagram('Untitled Diagram'));
    this.#manager = new DocumentManager(this.store, createRepository());
  }

  override connectedCallback(): void {
    super.connectedCallback();
    this.#manager.addEventListener('change', this.#onManagerChange);
    void this.#manager.init().catch((error: unknown) => {
      console.error('Failed to initialise document storage', error);
    });
  }

  override disconnectedCallback(): void {
    this.#manager.removeEventListener('change', this.#onManagerChange);
    this.#manager.dispose();
    super.disconnectedCallback();
  }

  override render() {
    const { diagram, canUndo, canRedo, selection } = this.store;

    return html`
      <div class="app">
        <erd-toolbar
          .canUndo=${canUndo}
          .canRedo=${canRedo}
          .connectMode=${this.connectFrom !== undefined}
          .gridVisible=${diagram.layout.grid.visible}
          .gridSnap=${diagram.layout.grid.snap}
          .diagramName=${diagram.name}
          @add-entity=${() => addEntity(this.store)}
          @toggle-connect=${this.#toggleConnect}
          @undo=${() => this.store.undo()}
          @redo=${() => this.store.redo()}
          @toggle-grid=${() =>
            this.store.dispatch(
              { type: 'SetGrid', patch: { visible: !diagram.layout.grid.visible } },
              { history: false },
            )}
          @toggle-snap=${() =>
            this.store.dispatch(
              { type: 'SetGrid', patch: { snap: !diagram.layout.grid.snap } },
              { history: false },
            )}
          @rename=${this.#onRename}
          @rename-commit=${() => this.store.endInteraction()}
          @export-native=${this.#exportNative}
          @export-svg=${this.#exportSvg}
          @import=${this.#onImport}
        ></erd-toolbar>
        <div class="body">
          <aside class="documents">
            <diagram-list
              .diagrams=${this.#manager.diagrams}
              .currentId=${this.#manager.currentId}
              @create=${() => this.#manager.create()}
              @open=${(event: CustomEvent<string>) => this.#manager.open(event.detail)}
              @delete=${(event: CustomEvent<string>) => this.#manager.remove(event.detail)}
            ></diagram-list>
          </aside>
          <main class="workspace">
            <erd-canvas
              .store=${this.store}
              .connectMode=${this.connectFrom !== undefined}
              @entity-pick=${this.#onEntityPick}
              @connect-cancel=${this.#cancelConnect}
              @edit-selection=${this.#onEditSelection}
            ></erd-canvas>
            ${
              this.connectFrom === undefined
                ? nothing
                : html`<div class="hint">${this.#hintText()}</div>`
            }
            <zoom-controls
              .zoom=${diagram.layout.viewport.zoom}
              @zoom-in=${() => this.canvas.zoomIn()}
              @zoom-out=${() => this.canvas.zoomOut()}
              @zoom-fit=${() => this.canvas.zoomToFit()}
              @zoom=${(event: CustomEvent<number>) => this.canvas.setZoom(event.detail)}
            ></zoom-controls>
          </main>
          <aside class="sidebar">
            ${
              selection === null
                ? html`<p class="empty">Select an entity or relationship to edit it.</p>`
                : selection.kind === 'entity'
                  ? html`<entity-inspector .store=${this.store}></entity-inspector>`
                  : html`<relationship-inspector .store=${this.store}></relationship-inspector>`
            }
          </aside>
        </div>
      </div>
    `;
  }

  #onManagerChange = (): void => {
    this.requestUpdate();
  };

  #hintText(): string {
    return this.connectFrom === null ? 'Select the source entity' : 'Select the target entity';
  }

  #onRename = (event: CustomEvent<string>): void => {
    this.store.dispatch(
      { type: 'RenameDiagram', name: event.detail },
      { coalesceKey: 'diagram-name' },
    );
  };

  #exportNative = (): void => {
    downloadText(`${this.#fileBase()}.barkerish.json`, serializeDiagram(this.store.diagram));
  };

  #exportSvg = (): void => {
    downloadText(
      `${this.#fileBase()}.svg`,
      serializeDiagramSvg(this.store.diagram),
      'image/svg+xml',
    );
  };

  #onImport = (event: CustomEvent<File>): void => {
    void this.#importFile(event.detail);
  };

  async #importFile(file: File): Promise<void> {
    try {
      const diagram = parseDiagramFile(await file.text());
      await this.#manager.importDiagram(diagram);
    } catch (error) {
      console.error('Import failed', error);
      window.alert(error instanceof Error ? error.message : 'Import failed.');
    }
  }

  #fileBase(): string {
    const base = this.store.diagram.name
      .trim()
      .replace(/[^a-z0-9._-]+/gi, '-')
      .replace(/^-+|-+$/g, '');
    return base || 'diagram';
  }

  #toggleConnect = (): void => {
    this.connectFrom = this.connectFrom === undefined ? null : undefined;
  };

  #cancelConnect = (): void => {
    this.connectFrom = undefined;
  };

  #onEditSelection = (
    event: CustomEvent<{ kind: 'entity' | 'relationship'; id: string }>,
  ): void => {
    void this.#focusInspector(event.detail.kind);
  };

  async #focusInspector(kind: 'entity' | 'relationship'): Promise<void> {
    await this.updateComplete;
    if (kind === 'entity') {
      await this.entityInspector.updateComplete;
      this.entityInspector.focusPrimaryField();
    } else {
      await this.relationshipInspector.updateComplete;
      this.relationshipInspector.focusPrimaryField();
    }
  }

  #onEntityPick = (event: CustomEvent<string>): void => {
    const entityId = event.detail;

    if (this.connectFrom === undefined) {
      return;
    }

    if (this.connectFrom === null) {
      this.connectFrom = entityId;
      return;
    }

    if (entityId === this.connectFrom) {
      return;
    }

    const relationship = createRelationship(
      createRelationshipEnd(this.connectFrom, { cardinality: 'one', optionality: 'optional' }),
      createRelationshipEnd(entityId, { cardinality: 'many', optionality: 'optional' }),
    );

    this.store.dispatch({ type: 'CreateRelationship', relationship });
    this.store.select({ kind: 'relationship', id: relationship.id });
    this.connectFrom = undefined;
  };
}

declare global {
  interface HTMLElementTagNameMap {
    'barker-app': BarkerApp;
  }
}
