import { describe, expect, it } from 'vitest';
import { addAttribute, addEntity, deleteSelection } from '../../src/store/actions.js';
import { EditorStore } from '../../src/store/editor-store.js';
import {
  createDiagram,
  createEntity,
  createEntityLayout,
  createRelationship,
  createRelationshipEnd,
} from '../../src/domain/model.js';

function newStore(): EditorStore {
  return new EditorStore(createDiagram());
}

describe('addEntity', () => {
  it('adds a positioned entity and selects it', () => {
    const store = newStore();

    const id = addEntity(store);

    expect(store.diagram.entities.map((entity) => entity.id)).toEqual([id]);
    expect(store.diagram.layout.entities[id]).toEqual({ x: 80, y: 80, width: 220 });
    expect(store.selection).toEqual({ kind: 'entity', id });
  });
});

describe('addAttribute', () => {
  it('appends an attribute to the entity', () => {
    const store = newStore();
    store.dispatch({
      type: 'AddEntity',
      entity: createEntity({ id: 'e1', attributes: [] }),
      layout: createEntityLayout({ x: 0, y: 0 }),
    });

    addAttribute(store, 'e1');

    expect(store.diagram.entities[0]?.attributes).toHaveLength(1);
  });

  it('ignores unknown entities', () => {
    const store = newStore();
    addAttribute(store, 'missing');
    expect(store.diagram.entities).toEqual([]);
  });
});

describe('deleteSelection', () => {
  it('deletes the selected entity', () => {
    const store = newStore();
    const id = addEntity(store);

    deleteSelection(store);

    expect(store.diagram.entities).toEqual([]);
    expect(id).toBeTruthy();
  });

  it('deletes the selected relationship', () => {
    const store = newStore();
    store.dispatch({
      type: 'CreateRelationship',
      relationship: createRelationship(createRelationshipEnd('a'), createRelationshipEnd('b'), {
        id: 'r1',
      }),
    });
    store.select({ kind: 'relationship', id: 'r1' });

    deleteSelection(store);

    expect(store.diagram.relationships).toEqual([]);
  });

  it('does nothing without a selection', () => {
    const store = newStore();
    deleteSelection(store);
    expect(store.diagram.entities).toEqual([]);
  });
});
