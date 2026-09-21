import { afterEach, describe, expect, it } from 'vitest';
import '../../src/app/barker-app.js';
import type { BarkerApp } from '../../src/app/barker-app.js';

describe('<barker-app>', () => {
  let element: BarkerApp | undefined;

  afterEach(() => {
    element?.remove();
    element = undefined;
  });

  it('renders its title', async () => {
    element = document.createElement('barker-app');
    document.body.append(element);
    await element.updateComplete;

    expect(element.shadowRoot?.textContent).toContain('Barkerish');
  });
});
