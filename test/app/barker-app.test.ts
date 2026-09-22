import { afterEach, describe, expect, it } from 'vitest';
import '../../src/app/barker-app.js';
import { addEntity } from '../../src/store/actions.js';
import type { BarkerApp } from '../../src/app/barker-app.js';
import type { EntityInspector } from '../../src/ui/entity-inspector.js';

async function mountApp(): Promise<BarkerApp> {
  const app = document.createElement('barker-app');
  document.body.append(app);
  await app.updateComplete;
  await new Promise((resolve) => setTimeout(resolve, 0));
  await app.updateComplete;
  return app;
}

describe('<barker-app>', () => {
  let element: BarkerApp | undefined;

  afterEach(() => {
    element?.remove();
    element = undefined;
  });

  it('composes the toolbar and canvas', async () => {
    element = await mountApp();

    expect(element.shadowRoot?.querySelector('erd-toolbar')).toBeTruthy();
    expect(element.shadowRoot?.querySelector('erd-canvas')).toBeTruthy();
  });

  it('shows the inspector empty state when nothing is selected', async () => {
    element = await mountApp();

    expect(element.shadowRoot?.querySelector('.sidebar .empty')).toBeTruthy();
  });

  it('does not delete an entity when Delete is pressed inside an inspector field', async () => {
    element = await mountApp();
    addEntity(element.store);
    await element.updateComplete;

    const inspector = element.shadowRoot!.querySelector('entity-inspector') as EntityInspector;
    await inspector.updateComplete;

    const input = inspector.shadowRoot!.querySelector(
      'input[data-role="entity-name"]',
    ) as HTMLInputElement;
    input.focus();
    input.dispatchEvent(
      new KeyboardEvent('keydown', { key: 'Delete', bubbles: true, composed: true }),
    );

    expect(element.store.diagram.entities).toHaveLength(1);
  });
});
