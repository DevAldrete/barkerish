import { LitElement, css, html } from 'lit';
import { customElement, property } from 'lit/decorators.js';
import type { DiagramMeta } from '../domain/types.js';

@customElement('diagram-list')
export class DiagramList extends LitElement {
  static override styles = css`
    :host {
      display: block;
      height: 100%;
      overflow: auto;
      background: #ffffff;
      border-right: 1px solid #e2e8f0;
    }

    .head {
      display: flex;
      align-items: center;
      justify-content: space-between;
      padding: 0.6rem 0.75rem;
      border-bottom: 1px solid #e2e8f0;
      font-size: 0.75rem;
      text-transform: uppercase;
      letter-spacing: 0.06em;
      color: #64748b;
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
      background: #e0edff;
    }

    .open {
      flex: 1;
      text-align: left;
      border: none;
      background: transparent;
      font: inherit;
      font-size: 0.83rem;
      color: #0f172a;
      padding: 0.4rem 0.5rem;
      border-radius: 6px;
      cursor: pointer;
      overflow: hidden;
      text-overflow: ellipsis;
      white-space: nowrap;
    }

    .open:hover {
      background: #eef2f7;
    }

    button {
      font: inherit;
      font-size: 0.78rem;
      padding: 0.3rem 0.5rem;
      border: 1px solid #cbd5e1;
      border-radius: 6px;
      background: #f8fafc;
      color: inherit;
      cursor: pointer;
    }

    button:hover {
      background: #eef2f7;
    }

    .delete {
      border: none;
      background: transparent;
      color: #94a3b8;
      padding: 0.3rem 0.45rem;
      line-height: 1;
    }

    .delete:hover {
      color: #b91c1c;
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
