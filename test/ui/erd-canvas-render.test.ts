import { afterEach, describe, expect, it } from 'vitest';
import '../../src/ui/erd-canvas.js';
import { createDiagram, createEntity, createEntityLayout } from '../../src/domain/model.js';
import { EditorStore } from '../../src/store/editor-store.js';
import type { ErdCanvas } from '../../src/ui/erd-canvas.js';

function mount(): { store: EditorStore; canvas: ErdCanvas } {
  const store = new EditorStore(createDiagram('D'));
  const canvas = document.createElement('erd-canvas');
  canvas.store = store;
  document.body.append(canvas);
  return { store, canvas };
}

describe('<erd-canvas> scene rendering', () => {
  let canvas: ErdCanvas | undefined;

  afterEach(() => {
    canvas?.remove();
    canvas = undefined;
  });

  it('renders entities and keeps them across a pan', async () => {
    const setup = mount();
    canvas = setup.canvas;
    setup.store.dispatch({
      type: 'AddEntity',
      entity: createEntity({ id: 'e1', name: 'Customer', attributes: [] }),
      layout: createEntityLayout({ x: 0, y: 0 }),
    });
    await canvas.updateComplete;

    expect(canvas.shadowRoot!.querySelectorAll('.entity')).toHaveLength(1);

    setup.store.dispatch(
      { type: 'SetViewport', viewport: { x: 120, y: 80, zoom: 1.5 } },
      { history: false },
    );
    await canvas.updateComplete;

    expect(canvas.shadowRoot!.querySelectorAll('.entity')).toHaveLength(1);
  });

  it('re-renders the scene when the model changes', async () => {
    const setup = mount();
    canvas = setup.canvas;
    await canvas.updateComplete;
    expect(canvas.shadowRoot!.querySelectorAll('.entity')).toHaveLength(0);

    setup.store.dispatch({
      type: 'AddEntity',
      entity: createEntity({ id: 'e1', name: 'Customer', attributes: [] }),
      layout: createEntityLayout({ x: 0, y: 0 }),
    });
    await canvas.updateComplete;
    expect(canvas.shadowRoot!.querySelectorAll('.entity')).toHaveLength(1);

    setup.store.dispatch({
      type: 'AddEntity',
      entity: createEntity({ id: 'e2', name: 'Order', attributes: [] }),
      layout: createEntityLayout({ x: 300, y: 0 }),
    });
    await canvas.updateComplete;
    expect(canvas.shadowRoot!.querySelectorAll('.entity')).toHaveLength(2);
  });

  it('highlights the selected entity', async () => {
    const setup = mount();
    canvas = setup.canvas;
    setup.store.dispatch({
      type: 'AddEntity',
      entity: createEntity({ id: 'e1', name: 'Customer', attributes: [] }),
      layout: createEntityLayout({ x: 0, y: 0 }),
    });
    await canvas.updateComplete;

    setup.store.select({ kind: 'entity', id: 'e1' });
    await canvas.updateComplete;

    expect(canvas.shadowRoot!.querySelector('.entity.is-selected')).toBeTruthy();
  });
});
