import { LitElement, nothing, css, html } from 'lit';
import type { PropertyValues } from 'lit';
import { customElement, property, query } from 'lit/decorators.js';
import { parseDocument } from '../dsl/index.js';
import type { DslError } from '../dsl/index.js';
import { BASE_STYLES } from './base-styles.js';

@customElement('dsl-editor')
export class DslEditor extends LitElement {
  static override styles = css`
    ${BASE_STYLES}

    :host {
      display: flex;
      flex-direction: column;
      min-height: 0;
      border-top: 1px solid var(--erd-border);
      background: var(--erd-surface);
      color: var(--erd-text);
    }

    .head {
      display: flex;
      align-items: center;
      gap: 0.5rem;
      padding: 0.4rem 0.6rem;
      border-bottom: 1px solid var(--erd-border);
      font-size: 0.8rem;
    }

    .title {
      font-weight: 600;
      text-transform: uppercase;
      letter-spacing: 0.06em;
      font-size: 0.72rem;
      color: var(--erd-text-muted);
    }

    .status {
      color: var(--erd-text-subtle);
      font-size: 0.75rem;
    }

    .status.error {
      color: var(--erd-danger);
    }

    .spacer {
      flex: 1;
    }

    button {
      font: inherit;
      font-size: 0.78rem;
      padding: 0.3rem 0.55rem;
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

    button.primary {
      border-color: var(--erd-accent);
      background: var(--erd-accent-soft);
      color: var(--erd-accent-strong);
    }

    .body {
      display: flex;
      flex: 1;
      min-height: 0;
    }

    textarea {
      flex: 1;
      min-width: 0;
      resize: none;
      border: none;
      outline: none;
      padding: 0.6rem 0.7rem;
      background: var(--erd-surface);
      color: var(--erd-text);
      font-family: ui-monospace, SFMono-Regular, Menlo, Consolas, monospace;
      font-size: 0.8rem;
      line-height: 1.5;
      tab-size: 2;
    }

    .errors {
      width: 20rem;
      flex-shrink: 0;
      margin: 0;
      padding: 0.4rem 0.5rem;
      list-style: none;
      overflow: auto;
      border-left: 1px solid var(--erd-border);
      background: var(--erd-bg);
    }

    .errors li {
      font-size: 0.75rem;
      line-height: 1.35;
      padding: 0.3rem 0.4rem;
      border-radius: 6px;
      color: var(--erd-danger);
      cursor: pointer;
    }

    .errors li:hover {
      background: var(--erd-surface-2);
    }
  `;

  @property() text = '';
  @property() status = '';
  @property({ attribute: false }) errors: DslError[] = [];

  @query('textarea') private textarea?: HTMLTextAreaElement;
  @query('input[type="file"]') private fileInput?: HTMLInputElement;

  /**
   * The editor owns its buffer. The `text` property is only adopted when it
   * actually changes, so an unrelated re-render (e.g. an autosave completing)
   * cannot clobber in-progress edits.
   */
  #value = '';
  #lastText = '';

  override willUpdate(changed: PropertyValues): void {
    if (changed.has('text') && this.text !== this.#lastText) {
      this.#lastText = this.text;
      this.#value = this.text;
    }
  }

  override render() {
    const parseErrors = parseDocument(this.#value).errors;
    const errors = [...parseErrors, ...this.errors];

    return html`
      <div class="head">
        <span class="title">Text</span>
        <span class="status ${errors.length > 0 ? 'error' : ''}">${this.status}</span>
        <span class="spacer"></span>
        <button @click=${() => this.#emit('refresh')}>From diagram</button>
        <button @click=${() => this.fileInput?.click()}>Load</button>
        <button @click=${() => this.#emit('save-file', this.#value)}>Save</button>
        <button
          class="primary"
          ?disabled=${parseErrors.length > 0}
          @click=${() => this.#emit('apply', this.#value)}
        >
          Apply
        </button>
        <button @click=${() => this.#emit('close')}>Close</button>
        <input type="file" accept=".txt,.barkerish,text/plain" hidden @change=${this.#onFile} />
      </div>
      <div class="body">
        <textarea
          .value=${this.#value}
          spellcheck="false"
          aria-label="Diagram text"
          @input=${this.#onInput}
          @keydown=${this.#onKeydown}
        ></textarea>
        ${
          errors.length > 0
            ? html`<ul class="errors">
                ${errors.map(
                  (error) =>
                    html`<li @click=${() => this.#focusLine(error.line)}>
                      ${error.line > 0 ? `Line ${error.line}: ` : ''}${error.message}
                    </li>`,
                )}
              </ul>`
            : nothing
        }
      </div>
    `;
  }

  #onInput = (event: Event): void => {
    this.#value = (event.target as HTMLTextAreaElement).value;
    this.requestUpdate();
  };

  #onKeydown = (event: KeyboardEvent): void => {
    if (event.key === 'Enter' && (event.metaKey || event.ctrlKey)) {
      event.preventDefault();
      this.#emit('apply', this.#value);
    }
  };

  #onFile = (event: Event): void => {
    const input = event.target as HTMLInputElement;
    const file = input.files?.[0];
    if (file) {
      this.#emit('load-file', file);
    }
    input.value = '';
  };

  #focusLine(line: number): void {
    if (!this.textarea || line <= 0) {
      return;
    }
    const lines = this.#value.split('\n');
    let offset = 0;
    for (let index = 0; index < line - 1 && index < lines.length; index += 1) {
      offset += (lines[index]?.length ?? 0) + 1;
    }
    const end = offset + (lines[line - 1]?.length ?? 0);
    this.textarea.focus();
    this.textarea.setSelectionRange(offset, end);
  }

  #emit<T>(type: string, detail?: T): void {
    this.dispatchEvent(new CustomEvent(type, { detail, bubbles: true, composed: true }));
  }
}

declare global {
  interface HTMLElementTagNameMap {
    'dsl-editor': DslEditor;
  }
}
