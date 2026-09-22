import { afterEach, describe, expect, it } from 'vitest';
import '../../src/app/barker-app.js';
import { createRelationship, createRelationshipEnd } from '../../src/domain/model.js';
import { addEntity } from '../../src/store/actions.js';
import type { BarkerApp } from '../../src/app/barker-app.js';
import type { EntityInspector } from '../../src/ui/entity-inspector.js';
import type { EntityList } from '../../src/ui/entity-list.js';

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

  it('shows the relationship editor when a relationship is selected', async () => {
    element = await mountApp();
    const source = addEntity(element.store);
    const target = addEntity(element.store);
    const relationship = createRelationship(
      createRelationshipEnd(source),
      createRelationshipEnd(target),
      { id: 'r1' },
    );
    element.store.dispatch({ type: 'CreateRelationship', relationship });
    element.store.select({ kind: 'relationship', id: 'r1' });
    await element.updateComplete;

    const sidebar = element.shadowRoot!.querySelector('.sidebar');
    expect(sidebar?.querySelector('relationship-inspector')).toBeTruthy();
    expect(sidebar?.querySelector('entity-inspector')).toBeFalsy();
  });

  it('lists entities and selects one from the list', async () => {
    element = await mountApp();
    const id = addEntity(element.store);
    await element.updateComplete;

    const list = element.shadowRoot!.querySelector('entity-list') as EntityList;
    await list.updateComplete;
    (list.shadowRoot!.querySelector('.open') as HTMLButtonElement).click();

    expect(element.store.selection).toEqual({ kind: 'entity', id });
  });

  it('opens the text editor and applies a document', async () => {
    element = await mountApp();
    const name = element.store.diagram.name;

    const toolbar = element.shadowRoot!.querySelector('erd-toolbar')!;
    await toolbar.updateComplete;
    const textButton = [...toolbar.shadowRoot!.querySelectorAll('button')].find(
      (button) => button.textContent?.trim() === 'Text',
    );
    textButton!.click();
    await element.updateComplete;
    await new Promise((resolve) => setTimeout(resolve, 0));
    await element.updateComplete;

    const editor = element.shadowRoot!.querySelector('dsl-editor') as HTMLElement & {
      updateComplete: Promise<unknown>;
    };
    expect(editor).toBeTruthy();

    editor.dispatchEvent(
      new CustomEvent('apply', {
        detail: `diagram "${name}" { entity Customer { id: integer pk } }`,
      }),
    );
    await new Promise((resolve) => setTimeout(resolve, 0));
    await element.updateComplete;

    expect(element.store.diagram.entities.map((entity) => entity.name)).toContain('Customer');
    expect(element.store.canUndo).toBe(true);

    element.store.undo();
    expect(element.store.diagram.entities).toHaveLength(0);
  });
});
