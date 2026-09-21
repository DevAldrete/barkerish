import { describe, expect, it, vi } from 'vitest';
import { EditorStore } from '../../src/store/editor-store.js';
import {
  createDiagram,
  createEntity,
  createEntityLayout,
  createRelationship,
  createRelationshipEnd,
} from '../../src/domain/model.js';
import type { Command } from '../../src/domain/commands.js';

function addEntity(id: string, x = 0, y = 0): Command {
  return {
    type: 'AddEntity',
    entity: createEntity({ id, name: id }),
    layout: createEntityLayout({ x, y }),
  };
}

function storeWithEntities(): EditorStore {
  const store = new EditorStore(createDiagram());
  store.dispatch(addEntity('e1'));
  store.dispatch(addEntity('e2'));
  return store;
}

describe('EditorStore', () => {
  it('applies commands and notifies listeners', () => {
    const store = new EditorStore(createDiagram());
    const listener = vi.fn();
    store.addEventListener('change', listener);

    store.dispatch(addEntity('e1'));

    expect(store.diagram.entities).toHaveLength(1);
    expect(listener).toHaveBeenCalledTimes(1);
  });

  it('does not notify for no-op commands', () => {
    const store = storeWithEntities();
    const listener = vi.fn();
    store.addEventListener('change', listener);

    store.dispatch({ type: 'DeleteEntity', entityId: 'missing' });

    expect(listener).not.toHaveBeenCalled();
  });

  it('undoes and redoes changes', () => {
    const store = storeWithEntities();

    store.undo();
    expect(store.diagram.entities.map((entity) => entity.id)).toEqual(['e1']);
    expect(store.canRedo).toBe(true);

    store.redo();
    expect(store.diagram.entities.map((entity) => entity.id)).toEqual(['e1', 'e2']);
  });

  it('coalesces consecutive commands sharing a key', () => {
    const store = storeWithEntities();

    store.dispatch({ type: 'MoveEntity', entityId: 'e1', x: 10, y: 0 }, { coalesceKey: 'move' });
    store.dispatch({ type: 'MoveEntity', entityId: 'e1', x: 20, y: 0 }, { coalesceKey: 'move' });
    store.endInteraction();
    store.dispatch({ type: 'MoveEntity', entityId: 'e1', x: 30, y: 0 }, { coalesceKey: 'move' });

    store.undo();
    expect(store.diagram.layout.entities['e1']?.x).toBe(20);
    store.undo();
    expect(store.diagram.layout.entities['e1']?.x).toBe(0);
  });

  it('applies transient changes without recording history', () => {
    const store = storeWithEntities();
    const undoDepthBefore = store.canUndo;

    store.dispatch({ type: 'SetViewport', viewport: { x: 5, y: 6, zoom: 2 } }, { history: false });

    expect(store.diagram.layout.viewport).toEqual({ x: 5, y: 6, zoom: 2 });
    expect(store.canUndo).toBe(undoDepthBefore);
  });

  it('clears a selection that no longer exists', () => {
    const store = storeWithEntities();
    store.select({ kind: 'entity', id: 'e1' });

    store.dispatch({ type: 'DeleteEntity', entityId: 'e1' });

    expect(store.selection).toBeNull();
  });

  it('keeps a selection that still exists', () => {
    const store = storeWithEntities();
    store.select({ kind: 'entity', id: 'e1' });

    store.dispatch({ type: 'RenameEntity', entityId: 'e1', name: 'Client' });

    expect(store.selection).toEqual({ kind: 'entity', id: 'e1' });
  });

  it('clears selection and history on load', () => {
    const store = storeWithEntities();
    store.select({ kind: 'entity', id: 'e1' });

    store.load(createDiagram('Fresh'));

    expect(store.diagram.name).toBe('Fresh');
    expect(store.selection).toBeNull();
    expect(store.canUndo).toBe(false);
    expect(store.dirty).toBe(false);
  });

  it('tracks the dirty flag', () => {
    const store = storeWithEntities();
    expect(store.dirty).toBe(true);

    store.markSaved();
    expect(store.dirty).toBe(false);
  });

  it('prunes a deleted relationship from the selection', () => {
    const store = storeWithEntities();
    store.dispatch({
      type: 'CreateRelationship',
      relationship: createRelationship(createRelationshipEnd('e1'), createRelationshipEnd('e2'), {
        id: 'r1',
      }),
    });
    store.select({ kind: 'relationship', id: 'r1' });

    store.dispatch({ type: 'DeleteRelationship', relationshipId: 'r1' });

    expect(store.selection).toBeNull();
  });
});
