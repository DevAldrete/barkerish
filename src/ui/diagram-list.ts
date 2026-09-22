import { LitElement, css, html } from 'lit';
import { customElement, property } from 'lit/decorators.js';
import type { DiagramMeta } from '../domain/types.js';
import { BASE_STYLES } from './base-styles.js';

@customElement('diagram-list')
export class DiagramList extends LitElement {
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
      gap: 0.25rem;
      border-radius: 6px;
    }

    li.current {
      background: var(--erd-accent-soft);
    }

    .open {
      flex: 1;
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

    button {
      font: inherit;
      font-size: 0.78rem;
      padding: 0.3rem 0.5rem;
      border: 1px solid var(--erd-border-strong);
      border-radius: 6px;
      background: var(--erd-surface-2);
      color: inherit;
      cursor: pointer;
    }

    button:hover {
      background: var(--erd-border);
    }

    .delete {
      border: none;
      background: transparent;
      color: var(--erd-text-subtle);
      padding: 0.3rem 0.45rem;
      line-height: 1;
    }

    .delete:hover {
      color: var(--erd-danger);
      background: transparent;
    }
  `;

  @property({ attribute: false }) diagrams: DiagramMeta[] = [];
  @property({ attribute: false }) currentId: string | null = null;

  override render() {
    return html`
      <div class="head">
        <span>Diagrams</span>
        <button @click=${() => this.#emit('create')}>New</button>
      </div>
      <ul>
        ${this.diagrams.map(
          (diagram) => html`
            <li class=${diagram.id === this.currentId ? 'current' : ''}>
              <button class="open" @click=${() => this.#emit('open', diagram.id)}>
                ${diagram.name}
              </button>
              <button
                class="delete"
                title="Delete diagram"
                aria-label="Delete diagram"
                @click=${() => this.#emit('delete', diagram.id)}
              >
                ✕
              </button>
            </li>
          `,
        )}
      </ul>
    `;
  }

  #emit<T>(type: string, detail?: T): void {
    this.dispatchEvent(new CustomEvent(type, { detail, bubbles: true, composed: true }));
  }
}

declare global {
  interface HTMLElementTagNameMap {
    'diagram-list': DiagramList;
  }
}
