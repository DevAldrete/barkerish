import { LitElement, css, html } from 'lit';
import { customElement, property } from 'lit/decorators.js';
import { MAX_ZOOM, MIN_ZOOM } from '../domain/model.js';
import { BASE_STYLES } from './base-styles.js';

const SLIDER_STEPS = 100;
const ZOOM_RANGE = Math.log(MAX_ZOOM / MIN_ZOOM);

@customElement('zoom-controls')
export class ZoomControls extends LitElement {
  static override styles = css`
    ${BASE_STYLES}

    :host {
      position: absolute;
      right: 1rem;
      bottom: 1rem;
      z-index: 5;
    }

    .zoom {
      display: flex;
      align-items: center;
      gap: 0.4rem;
      padding: 0.35rem 0.5rem;
      border: 1px solid var(--erd-border);
      border-radius: 10px;
      background: var(--erd-surface);
      box-shadow: 0 4px 16px var(--erd-shadow);
    }

    button {
      font: inherit;
      font-size: 0.85rem;
      line-height: 1;
      width: 1.7rem;
      height: 1.7rem;
      display: inline-flex;
      align-items: center;
      justify-content: center;
      border: 1px solid var(--erd-border-strong);
      border-radius: 7px;
      background: var(--erd-surface-2);
      color: var(--erd-text);
      cursor: pointer;
    }

    button:hover {
      background: var(--erd-border);
    }

    button.fit {
      width: auto;
      padding: 0 0.55rem;
      font-size: 0.78rem;
    }

    input[type='range'] {
      width: 8rem;
      accent-color: var(--erd-accent);
      cursor: pointer;
    }

    .value {
      min-width: 2.6rem;
      text-align: right;
      font-size: 0.75rem;
      font-variant-numeric: tabular-nums;
      color: var(--erd-text-muted);
    }
  `;

  @property({ type: Number }) zoom = 1;

  override render() {
    return html`
      <div class="zoom" role="group" aria-label="Zoom controls">
        <button title="Zoom out" aria-label="Zoom out" @click=${() => this.#emit('zoom-out')}>
          −
        </button>
        <input
          type="range"
          min="0"
          max=${SLIDER_STEPS}
          step="1"
          aria-label="Zoom level"
          .value=${String(this.#toSlider(this.zoom))}
          @input=${this.#onSlider}
        />
        <button title="Zoom in" aria-label="Zoom in" @click=${() => this.#emit('zoom-in')}>
          +
        </button>
        <span class="value">${Math.round(this.zoom * 100)}%</span>
        <button class="fit" title="Fit to view" @click=${() => this.#emit('zoom-fit')}>Fit</button>
      </div>
    `;
  }

  #onSlider = (event: Event): void => {
    const value = Number((event.target as HTMLInputElement).value);
    this.#emit('zoom', this.#fromSlider(value));
  };

  #toSlider(zoom: number): number {
    const clamped = Math.min(Math.max(zoom, MIN_ZOOM), MAX_ZOOM);
    return Math.round((Math.log(clamped / MIN_ZOOM) / ZOOM_RANGE) * SLIDER_STEPS);
  }

  #fromSlider(value: number): number {
    return MIN_ZOOM * Math.exp((value / SLIDER_STEPS) * ZOOM_RANGE);
  }

  #emit<T>(type: string, detail?: T): void {
    this.dispatchEvent(new CustomEvent(type, { detail, bubbles: true, composed: true }));
  }
}

declare global {
  interface HTMLElementTagNameMap {
    'zoom-controls': ZoomControls;
  }
}
