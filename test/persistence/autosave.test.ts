import { afterEach, describe, expect, it, vi } from 'vitest';
import { Autosave } from '../../src/persistence/autosave.js';
import { MemoryDiagramRepository } from '../../src/persistence/memory-repository.js';
import { EditorStore } from '../../src/store/editor-store.js';
import { createDiagram, createEntity, createEntityLayout } from '../../src/domain/model.js';

function storeWithChange(): EditorStore {
  const store = new EditorStore(createDiagram());
  store.dispatch({
    type: 'AddEntity',
    entity: createEntity({ id: 'e1' }),
    layout: createEntityLayout({ x: 0, y: 0 }),
  });
  return store;
}

describe('Autosave', () => {
  afterEach(() => {
    vi.useRealTimers();
  });

  it('saves shortly after a change and clears the dirty flag', async () => {
    vi.useFakeTimers();
    const store = new EditorStore(createDiagram());
    const repository = new MemoryDiagramRepository();
    const autosave = new Autosave(store, repository, 100);
    autosave.start();

    store.dispatch({
      type: 'AddEntity',
      entity: createEntity({ id: 'e1' }),
      layout: createEntityLayout({ x: 0, y: 0 }),
    });
    expect(store.dirty).toBe(true);

    await vi.advanceTimersByTimeAsync(100);

    expect(store.dirty).toBe(false);
    expect(await repository.list()).toHaveLength(1);

    autosave.stop();
  });

  it('flushes immediately on demand', async () => {
    const store = storeWithChange();
    const repository = new MemoryDiagramRepository();
    const autosave = new Autosave(store, repository);
    autosave.start();

    await autosave.flush();

    expect(store.dirty).toBe(false);
    expect(await repository.list()).toHaveLength(1);

    autosave.stop();
  });

  it('does nothing when there are no changes', async () => {
    const store = new EditorStore(createDiagram());
    const repository = new MemoryDiagramRepository();
    const autosave = new Autosave(store, repository);
    autosave.start();

    await autosave.flush();

    expect(await repository.list()).toEqual([]);

    autosave.stop();
  });
});
