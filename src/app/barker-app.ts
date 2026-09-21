import { LitElement, css, html } from 'lit';
import { customElement } from 'lit/decorators.js';

@customElement('barker-app')
export class BarkerApp extends LitElement {
  static override styles = css`
    :host {
      display: block;
      min-height: 100vh;
      font-family:
        system-ui,
        -apple-system,
        'Segoe UI',
        sans-serif;
      color: #1f2937;
      background: #f8fafc;
    }
  `;

  override render() {
    return html`<h1>Barkerish</h1>`;
  }
}

declare global {
  interface HTMLElementTagNameMap {
    'barker-app': BarkerApp;
  }
}
