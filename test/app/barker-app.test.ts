import { afterEach, describe, expect, it } from 'vitest';
import '../../src/app/barker-app.js';
import type { BarkerApp } from '../../src/app/barker-app.js';

describe('<barker-app>', () => {
  let element: BarkerApp | undefined;

  afterEach(() => {
    element?.remove();
    element = undefined;
  });

  it('composes the toolbar and canvas', async () => {
    element = document.createElement('barker-app');
    document.body.append(element);
    await element.updateComplete;

    expect(element.shadowRoot?.querySelector('erd-toolbar')).toBeTruthy();
    expect(element.shadowRoot?.querySelector('erd-canvas')).toBeTruthy();
  });

  it('shows the inspector empty state when nothing is selected', async () => {
    element = document.createElement('barker-app');
    document.body.append(element);
    await element.updateComplete;

    expect(element.shadowRoot?.querySelector('.sidebar .empty')).toBeTruthy();
  });
});
