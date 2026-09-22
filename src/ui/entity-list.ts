import { LitElement, css, html } from 'lit';
import { customElement, property } from 'lit/decorators.js';
import type { Entity } from '../domain/types.js';
import { BASE_STYLES } from './base-styles.js';

@customElement('entity-list')
export class EntityList extends LitElement {
  static override styles = css`
    ${BASE_STYLES}

    :host {
      display: block;
      overflow: auto;
      background: var(--erd-surface);
      color: var(--erd-text);
    }

    .head {
      display: flex;
      align-items: center;
      justify-content: space-between;
      padding: 0.6rem 0.75rem;
      border-bottom: 1px solid var(--erd-border);
      font-size: 0.75rem;
      text-transform: uppercase;
      letter-spacing: 0.06em;
      color: var(--erd-text-muted);
    }

    .count {
      font-variant-numeric: tabular-nums;
      color: var(--erd-text-subtle);
    }

    ul {
      list-style: none;
      margin: 0;
      padding: 0.35rem;
      display: flex;
      flex-direction: column;
      gap: 0.15rem;
    }

    li {
      display: flex;
      align-items: center;
      gap: 0.15rem;
      border-radius: 6px;
    }

    li.current {
      background: var(--erd-accent-soft);
    }

    .open {
      flex: 1;
      min-width: 0;
      text-align: left;
      border: none;
      background: transparent;
      font: inherit;
      font-size: 0.83rem;
      color: var(--erd-text);
      padding: 0.4rem 0.5rem;
      border-radius: 6px;
      cursor: pointer;
      overflow: hidden;
      text-overflow: ellipsis;
      white-space: nowrap;
    }

    .open:hover {
      background: var(--erd-surface-2);
    }

    .icon {
      border: none;
      background: transparent;
      color: var(--erd-text-subtle);
      font-size: 0.8rem;
      line-height: 1;
      padding: 0.3rem 0.4rem;
      border-radius: 6px;
      cursor: pointer;
      opacity: 0;
    }

    li:hover .icon,
    li.current .icon,
    .icon:focus-visible {
      opacity: 1;
    }

    .icon:hover {
      color: var(--erd-text);
      background: var(--erd-surface-2);
    }

    .icon.delete:hover {
      color: var(--erd-danger);
    }

    .empty {
      padding: 0.5rem 0.75rem;
      font-size: 0.78rem;
      color: var(--erd-text-subtle);
    }
  `;

  @property({ attribute: false }) entities: Entity[] = [];
  @property({ attribute: false }) selectedId: string | null = null;

  override render() {
    return html`
      <div class="head">
        <span>Entities</span>
        <span class="count">${this.entities.length}</span>
      </div>
      ${
        this.entities.length === 0
          ? html`<p class="empty">No entities yet.</p>`
          : html`
              <ul>
                ${this.entities.map((entity) => this.#renderRow(entity))}
              </ul>
            `
      }
    `;
  }

  #renderRow(entity: Entity) {
    return html`
      <li class=${entity.id === this.selectedId ? 'current' : ''}>
        <button
          class="open"
          title=${entity.name}
          @click=${() => this.#emit('select', entity.id)}
          @dblclick=${() => this.#emit('edit', entity.id)}
        >
          ${entity.name}
        </button>
        <button
          class="icon"
          title="Zoom to entity"
          aria-label="Zoom to entity"
          @click=${() => this.#emit('fit', entity.id)}
        >
          ⤢
        </button>
        <button
          class="icon"
          title="Edit entity"
          aria-label="Edit entity"
          @click=${() => this.#emit('edit', entity.id)}
        >
          ✎
        </button>
        <button
          class="icon delete"
          title="Delete entity"
          aria-label="Delete entity"
          @click=${() => this.#emit('delete', entity.id)}
        >
          ✕
        </button>
      </li>
    `;
  }

  #emit<T>(type: string, detail?: T): void {
    this.dispatchEvent(new CustomEvent(type, { detail, bubbles: true, composed: true }));
  }
}

declare global {
  interface HTMLElementTagNameMap {
    'entity-list': EntityList;
  }
}
