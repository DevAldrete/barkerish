import { css, html, nothing } from 'lit';
import { customElement, query, state } from 'lit/decorators.js';
import { createDiagram, createRelationship, createRelationshipEnd } from '../domain/model.js';
import type { DslError } from '../dsl/index.js';
import { downloadText } from '../io/download.js';
import { createRepository } from '../persistence/create-repository.js';
import { parseDiagramFile, serializeDiagram } from '../persistence/native-format.js';
import { serializeDiagramSvg } from '../render/svg-export.js';
import { addEntity } from '../store/actions.js';
import { DocumentManager } from '../store/document-manager.js';
import { EditorStore } from '../store/editor-store.js';
import { applyTheme, DEFAULT_THEME, loadTheme, saveTheme } from '../theme/themes.js';
import type { ThemeId } from '../theme/themes.js';
import { StoreElement } from '../ui/store-element.js';
import '../ui/diagram-list.js';
import '../ui/erd-canvas.js';
import '../ui/erd-toolbar.js';
import '../ui/entity-inspector.js';
import '../ui/entity-list.js';
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
      width: 15rem;
      flex-shrink: 0;
      display: flex;
      flex-direction: column;
      border-right: 1px solid var(--erd-border);
      background: var(--erd-surface);
    }

    diagram-list {
      flex: 0 1 auto;
      max-height: 45%;
      border-bottom: 1px solid var(--erd-border);
    }

    entity-list {
      flex: 1 1 auto;
      min-height: 0;
    }

    .workspace {
      display: flex;
      flex-direction: column;
      flex: 1;
      min-width: 0;
    }

    .canvas-area {
      position: relative;
      flex: 1;
      min-height: 0;
    }

    erd-canvas {
      position: absolute;
      inset: 0;
    }

    dsl-editor {
      height: 40%;
      flex-shrink: 0;
    }

    .hint {
      position: absolute;
      top: 0.75rem;
      left: 50%;
      transform: translateX(-50%);
      padding: 0.4rem 0.75rem;
      border-radius: 999px;
      background: var(--erd-accent-strong);
      color: var(--erd-accent-contrast);
      font-size: 0.78rem;
      pointer-events: none;
      box-shadow: 0 2px 8px var(--erd-shadow);
    }

    .sidebar {
      width: 20rem;
      flex-shrink: 0;
      border-left: 1px solid var(--erd-border);
      background: var(--erd-bg);
      overflow: auto;
    }

    .empty {
      padding: 0.9rem;
      font-size: 0.8rem;
      color: var(--erd-text-subtle);
    }
  `;

  @query('erd-canvas') private canvas!: ErdCanvas;
  @query('entity-inspector') private entityInspector!: EntityInspector;
  @query('relationship-inspector') private relationshipInspector!: RelationshipInspector;

  /** undefined = not connecting, null = picking source, string = picking target. */
  @state() private connectFrom: string | null | undefined = undefined;

  @state() private theme: ThemeId = DEFAULT_THEME;

  @state() private textOpen = false;
  @state() private dslText = '';
  @state() private dslErrors: DslError[] = [];
  @state() private dslStatus = '';

  readonly #manager: DocumentManager;
  #dslEditorLoaded: Promise<unknown> | undefined;

  constructor() {
    super();
    this.store = new EditorStore(createDiagram('Untitled Diagram'));
    this.#manager = new DocumentManager(this.store, createRepository());

    this.theme = loadTheme();
    applyTheme(this.theme);
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
          .textOpen=${this.textOpen}
          .gridVisible=${diagram.layout.grid.visible}
          .gridSnap=${diagram.layout.grid.snap}
          .diagramName=${diagram.name}
          .theme=${this.theme}
          @add-entity=${() => addEntity(this.store)}
          @toggle-connect=${this.#toggleConnect}
          @toggle-text=${this.#toggleText}
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
          @theme=${this.#onTheme}
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
            <entity-list
              .entities=${diagram.entities}
              .selectedId=${selection?.kind === 'entity' ? selection.id : null}
              @select=${this.#onEntitySelect}
              @edit=${this.#onEntityEdit}
              @fit=${this.#onEntityFit}
              @delete=${this.#onEntityDelete}
            ></entity-list>
          </aside>
          <main class="workspace">
            <div class="canvas-area">
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
            </div>
            ${
              this.textOpen
                ? html`<dsl-editor
                    .text=${this.dslText}
                    .errors=${this.dslErrors}
                    .status=${this.dslStatus}
                    @refresh=${this.#onDslRefresh}
                    @apply=${this.#onDslApply}
                    @save-file=${this.#onDslSave}
                    @load-file=${this.#onDslLoad}
                    @close=${() => (this.textOpen = false)}
                  ></dsl-editor>`
                : nothing
            }
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
      serializeDiagramSvg(this.store.diagram, this.theme),
      'image/svg+xml',
    );
  };

  #onTheme = (event: CustomEvent<ThemeId>): void => {
    this.theme = event.detail;
    applyTheme(this.theme);
    saveTheme(this.theme);
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

  #toggleText = (): void => {
    if (this.textOpen) {
      this.textOpen = false;
      return;
    }
    void this.#openText().catch((error: unknown) => {
      console.error('Failed to open the text editor', error);
    });
  };

  async #openText(): Promise<void> {
    await this.#loadDslEditor();
    await this.#loadDslText();
    this.dslStatus = 'Ctrl/Cmd + Enter to apply.';
    this.textOpen = true;
  }

  /** Load the DSL editor on demand so it stays out of the initial bundle. */
  #loadDslEditor(): Promise<unknown> {
    this.#dslEditorLoaded ??= import('../ui/dsl-editor.js').catch((error: unknown) => {
      this.#dslEditorLoaded = undefined;
      throw error;
    });
    return this.#dslEditorLoaded;
  }

  async #loadDslText(): Promise<void> {
    const { serializeDocument } = await import('../dsl/index.js');
    const diagrams = await this.#manager.loadAll();
    this.dslText = serializeDocument(diagrams);
    this.dslErrors = [];
  }

  #onDslRefresh = (): void => {
    void this.#loadDslText().then(() => {
      this.dslStatus = 'Loaded from the diagram.';
    });
  };

  #onDslApply = (event: CustomEvent<string>): void => {
    void this.#applyDsl(event.detail);
  };

  async #applyDsl(text: string): Promise<void> {
    const { planDocument, applyDocument } = await import('../store/apply-document.js');
    const plan = await planDocument(text, this.#manager);
    if (plan.errors.length > 0) {
      this.dslErrors = plan.errors;
      this.dslStatus = 'Fix the errors to apply.';
      return;
    }

    if (plan.removed.length > 0) {
      const names = plan.removed.map((diagram) => diagram.name).join(', ');
      const confirmed = window.confirm(
        `This text removes ${plan.removed.length} diagram(s): ${names}. Delete them?`,
      );
      if (!confirmed) {
        this.dslStatus = 'Apply cancelled.';
        return;
      }
    }

    this.dslErrors = [];
    await applyDocument(plan, this.#manager, this.store);
    await this.#loadDslText();
    this.dslStatus = 'Applied.';
  }

  #onDslSave = (event: CustomEvent<string>): void => {
    downloadText('diagrams.barkerish.txt', event.detail, 'text/plain');
  };

  #onDslLoad = (event: CustomEvent<File>): void => {
    void this.#loadDslFile(event.detail);
  };

  async #loadDslFile(file: File): Promise<void> {
    this.dslText = await file.text();
    this.dslErrors = [];
    this.dslStatus = 'File loaded. Review and press Apply.';
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

  #onEntitySelect = (event: CustomEvent<string>): void => {
    this.store.select({ kind: 'entity', id: event.detail });
  };

  #onEntityEdit = (event: CustomEvent<string>): void => {
    this.store.select({ kind: 'entity', id: event.detail });
    void this.#focusInspector('entity');
  };

  #onEntityFit = (event: CustomEvent<string>): void => {
    this.canvas.zoomToEntity(event.detail);
  };

  #onEntityDelete = (event: CustomEvent<string>): void => {
    this.store.dispatch({ type: 'DeleteEntity', entityId: event.detail });
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
