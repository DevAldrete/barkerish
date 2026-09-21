import { css, html } from 'lit';
import { customElement, property, query } from 'lit/decorators.js';
import type { Viewport } from '../domain/types.js';
import { snapToGrid } from '../notation/geometry.js';
import type { Box, Point } from '../notation/geometry.js';
import { entityBox } from '../notation/geometry.js';
import { renderScene } from '../render/scene.js';
import { deleteSelection } from '../store/actions.js';
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
    :host {
      display: block;
      position: relative;
      background: #f8fafc;
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

    .grid {
      opacity: 0.9;
    }

    .grid__line {
      stroke: #e2e8f0;
      stroke-width: 1;
    }

    .entity {
      cursor: move;
    }

    .entity__body {
      fill: #ffffff;
      stroke: #94a3b8;
      stroke-width: 1.5;
    }

    .entity__header {
      fill: #e2e8f0;
      stroke: #94a3b8;
      stroke-width: 1.5;
    }

    .entity__name {
      fill: #0f172a;
      font-size: 14px;
      font-weight: 600;
    }

    .attribute__marker {
      fill: #475569;
      font-size: 12px;
      font-weight: 700;
    }

    .attribute__name {
      fill: #1e293b;
      font-size: 12px;
    }

    .attribute__type {
      fill: #64748b;
      font-size: 11px;
    }

    .attribute__unique {
      fill: #7c3aed;
      font-size: 10px;
      font-weight: 700;
    }

    .entity.is-selected .entity__body {
      stroke: #2563eb;
      stroke-width: 2.5;
    }

    .relationship__line {
      stroke: #64748b;
      stroke-width: 1.5;
      fill: none;
    }

    .relationship__crowfoot,
    .relationship__bar {
      stroke: #475569;
      stroke-width: 1.5;
      fill: none;
    }

    .relationship__label {
      fill: #475569;
      font-size: 11px;
      pointer-events: none;
    }

    .relationship.is-selected .relationship__line,
    .relationship.is-selected .relationship__crowfoot,
    .relationship.is-selected .relationship__bar {
      stroke: #2563eb;
      stroke-width: 2.5;
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
      >
        <g transform="translate(${x} ${y}) scale(${zoom})">${renderScene(diagram, selection)}</g>
      </svg>
    `;
  }

  zoomIn(): void {
    this.#zoomBy(1.2);
  }

  zoomOut(): void {
    this.#zoomBy(1 / 1.2);
  }

  zoomToFit(): void {
    const { diagram } = this.store;
    const boxes = diagram.entities
      .map((entity) => {
        const layout = diagram.layout.entities[entity.id];
        return layout ? entityBox(layout, entity.attributes.length) : undefined;
      })
      .filter((box): box is Box => box !== undefined);

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

  #onKeyDown = (event: KeyboardEvent): void => {
    if (isEditableTarget(event.target)) {
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

function isEditableTarget(target: EventTarget | null): boolean {
  const element = target as HTMLElement | null;
  if (!element) {
    return false;
  }
  const tag = element.tagName;
  return tag === 'INPUT' || tag === 'TEXTAREA' || tag === 'SELECT' || element.isContentEditable;
}

declare global {
  interface HTMLElementTagNameMap {
    'erd-canvas': ErdCanvas;
  }
}
