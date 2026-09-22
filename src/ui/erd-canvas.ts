import { css, html, nothing } from 'lit';
import { customElement, property, query } from 'lit/decorators.js';
import type { Viewport } from '../domain/types.js';
import { snapToGrid } from '../notation/geometry.js';
import type { Box, Point } from '../notation/geometry.js';
import { entityBox } from '../notation/geometry.js';
import { renderScene } from '../render/scene.js';
import { SVG_STYLES } from '../render/svg-styles.js';
import { deleteSelection } from '../store/actions.js';
import { BASE_STYLES } from './base-styles.js';
import { StoreElement } from './store-element.js';
import { clampZoom, panBy, screenToWorld, zoomAt } from './viewport.js';

type DragState =
  | {
      kind: 'entity';
      entityId: string;
      pointerId: number;
      origin: Point;
      startWorld: Point;
    }
  | { kind: 'pan'; pointerId: number; startScreen: Point };

const FIT_PADDING = 48;

@customElement('erd-canvas')
export class ErdCanvas extends StoreElement {
  static override styles = css`
    ${BASE_STYLES}
    ${SVG_STYLES}

    :host {
      display: block;
      position: relative;
      background: var(--erd-bg);
    }

    .canvas {
      display: block;
      width: 100%;
      height: 100%;
      touch-action: none;
      cursor: grab;
      user-select: none;
    }

    .canvas:active {
      cursor: grabbing;
    }

    .canvas.is-connecting {
      cursor: crosshair;
    }

    .empty-hint {
      position: absolute;
      inset: 0;
      display: flex;
      align-items: center;
      justify-content: center;
      color: var(--erd-text-subtle);
      font-size: 0.9rem;
      pointer-events: none;
    }
  `;

  @query('.canvas') private svgRoot!: SVGSVGElement;

  /** When true, clicking entities picks endpoints instead of moving them. */
  @property({ type: Boolean, attribute: false }) connectMode = false;

  #drag: DragState | null = null;

  override connectedCallback(): void {
    super.connectedCallback();
    window.addEventListener('keydown', this.#onKeyDown);
  }

  override disconnectedCallback(): void {
    window.removeEventListener('keydown', this.#onKeyDown);
    super.disconnectedCallback();
  }

  override render() {
    const { diagram, selection } = this.store;
    const { x, y, zoom } = diagram.layout.viewport;

    return html`
      <svg
        class="canvas ${this.connectMode ? 'is-connecting' : ''}"
        @pointerdown=${this.#onPointerDown}
        @pointermove=${this.#onPointerMove}
        @pointerup=${this.#onPointerUp}
        @pointercancel=${this.#onPointerUp}
        @wheel=${this.#onWheel}
        @contextmenu=${this.#onContextMenu}
        @dblclick=${this.#onDoubleClick}
      >
        <g transform="translate(${x} ${y}) scale(${zoom})">${renderScene(diagram, selection)}</g>
      </svg>
      ${
        diagram.entities.length === 0
          ? html`<div class="empty-hint">Add an entity to get started.</div>`
          : nothing
      }
    `;
  }

  zoomIn(): void {
    this.#zoomBy(1.2);
  }

  zoomOut(): void {
    this.#zoomBy(1 / 1.2);
  }

  /** Set an absolute zoom level, keeping the canvas centre fixed. */
  setZoom(zoom: number): void {
    const current = this.store.diagram.layout.viewport.zoom;
    if (current === 0) {
      return;
    }
    this.#zoomBy(zoom / current);
  }

  zoomToFit(): void {
    const { diagram } = this.store;
    const boxes = diagram.entities
      .map((entity) => {
        const layout = diagram.layout.entities[entity.id];
        return layout ? entityBox(layout, entity.attributes.length) : undefined;
      })
      .filter((box): box is Box => box !== undefined);

    this.#fitBoxes(boxes);
  }

  /** Pan and zoom so a single entity fills the view. */
  zoomToEntity(entityId: string): void {
    const { diagram } = this.store;
    const entity = diagram.entities.find((candidate) => candidate.id === entityId);
    const layout = diagram.layout.entities[entityId];
    if (!entity || !layout) {
      return;
    }
    this.#fitBoxes([entityBox(layout, entity.attributes.length)]);
  }

  #fitBoxes(boxes: Box[]): void {
    if (boxes.length === 0) {
      return;
    }

    const rect = this.svgRoot.getBoundingClientRect();
    if (rect.width === 0 || rect.height === 0) {
      return;
    }

    const minX = Math.min(...boxes.map((box) => box.x));
    const minY = Math.min(...boxes.map((box) => box.y));
    const maxX = Math.max(...boxes.map((box) => box.x + box.width));
    const maxY = Math.max(...boxes.map((box) => box.y + box.height));
    const width = Math.max(maxX - minX, 1);
    const height = Math.max(maxY - minY, 1);

    const zoom = clampZoom(
      Math.min((rect.width - FIT_PADDING * 2) / width, (rect.height - FIT_PADDING * 2) / height),
    );

    this.store.dispatch(
      {
        type: 'SetViewport',
        viewport: {
          zoom,
          x: (rect.width - width * zoom) / 2 - minX * zoom,
          y: (rect.height - height * zoom) / 2 - minY * zoom,
        },
      },
      { history: false },
    );
  }

  #zoomBy(factor: number): void {
    const rect = this.svgRoot.getBoundingClientRect();
    this.#setViewport(
      zoomAt(this.store.diagram.layout.viewport, { x: rect.width / 2, y: rect.height / 2 }, factor),
    );
  }

  #setViewport(viewport: Viewport): void {
    if (viewport === this.store.diagram.layout.viewport) {
      return;
    }
    this.store.dispatch({ type: 'SetViewport', viewport }, { history: false });
  }

  #toScreen(event: { clientX: number; clientY: number }): Point {
    const rect = this.svgRoot.getBoundingClientRect();
    return { x: event.clientX - rect.left, y: event.clientY - rect.top };
  }

  #toWorld(event: { clientX: number; clientY: number }): Point {
    return screenToWorld(this.#toScreen(event), this.store.diagram.layout.viewport);
  }

  #onPointerDown = (event: PointerEvent): void => {
    if (event.button !== 0) {
      return;
    }

    const target = event.target as Element;
    const entityElement = target.closest('[data-entity-id]');
    const relationshipElement = target.closest('[data-relationship-id]');

    this.svgRoot.setPointerCapture?.(event.pointerId);
    event.preventDefault();

    if (entityElement) {
      const entityId = entityElement.getAttribute('data-entity-id');
      if (!entityId) {
        return;
      }

      if (this.connectMode) {
        this.#emit('entity-pick', entityId);
        return;
      }

      this.store.select({ kind: 'entity', id: entityId });
      const layout = this.store.diagram.layout.entities[entityId];
      if (layout) {
        this.#drag = {
          kind: 'entity',
          entityId,
          pointerId: event.pointerId,
          origin: { x: layout.x, y: layout.y },
          startWorld: this.#toWorld(event),
        };
      }
      return;
    }

    if (relationshipElement) {
      const relationshipId = relationshipElement.getAttribute('data-relationship-id');
      if (relationshipId) {
        this.store.select({ kind: 'relationship', id: relationshipId });
      }
      return;
    }

    if (this.connectMode) {
      this.#emit('connect-cancel');
      return;
    }

    this.store.select(null);
    this.#drag = {
      kind: 'pan',
      pointerId: event.pointerId,
      startScreen: this.#toScreen(event),
    };
  };

  #onPointerMove = (event: PointerEvent): void => {
    const drag = this.#drag;
    if (!drag || drag.pointerId !== event.pointerId) {
      return;
    }

    if (drag.kind === 'pan') {
      const screen = this.#toScreen(event);
      this.#setViewport(
        panBy(
          this.store.diagram.layout.viewport,
          screen.x - drag.startScreen.x,
          screen.y - drag.startScreen.y,
        ),
      );
      drag.startScreen = screen;
      return;
    }

    const world = this.#toWorld(event);
    let x = drag.origin.x + (world.x - drag.startWorld.x);
    let y = drag.origin.y + (world.y - drag.startWorld.y);

    const grid = this.store.diagram.layout.grid;
    if (grid.snap) {
      x = snapToGrid(x, grid.size);
      y = snapToGrid(y, grid.size);
    }

    const layout = this.store.diagram.layout.entities[drag.entityId];
    if (!layout || (layout.x === x && layout.y === y)) {
      return;
    }

    this.store.dispatch(
      { type: 'MoveEntity', entityId: drag.entityId, x, y },
      { coalesceKey: `move:${drag.entityId}` },
    );
  };

  #onPointerUp = (event: PointerEvent): void => {
    const drag = this.#drag;
    if (!drag || drag.pointerId !== event.pointerId) {
      return;
    }
    this.#drag = null;
    this.store.endInteraction();
    this.svgRoot.releasePointerCapture?.(event.pointerId);
  };

  #onWheel = (event: WheelEvent): void => {
    event.preventDefault();
    const factor = Math.exp(-event.deltaY * 0.0015);
    this.#setViewport(zoomAt(this.store.diagram.layout.viewport, this.#toScreen(event), factor));
  };

  #onContextMenu = (event: Event): void => {
    event.preventDefault();
  };

  #onDoubleClick = (event: MouseEvent): void => {
    const target = event.target as Element;
    const entityElement = target.closest('[data-entity-id]');
    const relationshipElement = target.closest('[data-relationship-id]');

    if (entityElement) {
      const entityId = entityElement.getAttribute('data-entity-id');
      if (entityId) {
        this.store.select({ kind: 'entity', id: entityId });
        this.#emit('edit-selection', { kind: 'entity', id: entityId });
      }
      return;
    }

    if (relationshipElement) {
      const relationshipId = relationshipElement.getAttribute('data-relationship-id');
      if (relationshipId) {
        this.store.select({ kind: 'relationship', id: relationshipId });
        this.#emit('edit-selection', { kind: 'relationship', id: relationshipId });
      }
    }
  };

  #onKeyDown = (event: KeyboardEvent): void => {
    if (isEditableTarget(event)) {
      return;
    }

    const modifier = event.metaKey || event.ctrlKey;

    if (modifier && event.key.toLowerCase() === 'z') {
      event.preventDefault();
      if (event.shiftKey) {
        this.store.redo();
      } else {
        this.store.undo();
      }
      return;
    }

    if (event.key === 'Delete' || event.key === 'Backspace') {
      if (!this.store.selection) {
        return;
      }
      event.preventDefault();
      deleteSelection(this.store);
      return;
    }

    if (event.key === 'Escape') {
      if (this.connectMode) {
        this.#emit('connect-cancel');
        return;
      }
      this.store.select(null);
    }
  };

  #emit<T>(type: string, detail?: T): void {
    this.dispatchEvent(new CustomEvent(type, { detail, bubbles: true, composed: true }));
  }
}

/**
 * Whether the event originated inside a text-editable control. Uses the composed
 * path because listeners on `window` see the shadow host, not the inner input.
 */
export function isEditableTarget(event: Event): boolean {
  for (const node of event.composedPath()) {
    if (node instanceof HTMLElement) {
      const tag = node.tagName;
      if (tag === 'INPUT' || tag === 'TEXTAREA' || tag === 'SELECT' || node.isContentEditable) {
        return true;
      }
    }
  }
  return false;
}

declare global {
  interface HTMLElementTagNameMap {
    'erd-canvas': ErdCanvas;
  }
}
